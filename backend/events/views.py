import logging
from datetime import date, datetime

from django.shortcuts import render
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, mixins
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import Http404, HttpResponse
from .serializers import EventSerializer, InvitationCreateSerializer, PersInvCreateSerializer,\
                         InvitationAcceptSerializer, PersInvAcceptSerializer,\
                         InvitationDetailsSerializer, PersInvDetailsSerializer,\
                         EventAdminSerializer, EventSerializer, CommentSerializer
from .models import Event, Invitation, PersonalizedInvitation, Participant, \
                            Comment
from .utils import event_to_ics
from django.http import HttpResponse
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from .tasks import (
    send_event_invite_email_task,
    send_event_admin_link_task,
    send_event_update_notification_task,
    send_event_cancellation_notification_task
)

logger = logging.getLogger(__name__)


class EventAdminViewSet(mixins.CreateModelMixin,
                        mixins.UpdateModelMixin,
                        mixins.RetrieveModelMixin,
                        mixins.DestroyModelMixin,
                        viewsets.GenericViewSet):
    queryset = Event.objects.all()
    serializer_class = EventAdminSerializer
    lookup_field = 'uuid'

    def perform_create(self, serializer):
        event = serializer.save()
        try:
            send_event_admin_link_task.send(
                creator_email=event.organizer_email,
                creator_name=event.organizer_name,
                event_name=event.name,
                event_uuid=str(event.uuid),
                event_edit_uuid=str(event.edit_uuid)
            )
        except Exception as e:
            logger.error(f"Failed to enqueue admin link task for event {event.uuid}: {e}")

    def update(self, request, *args, **kwargs):
        edit_uuid = kwargs.get('edit_uuid')
        instance = self.get_object()
        if not edit_uuid or str(instance.edit_uuid) != str(edit_uuid):
             raise Http404

        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        updated = serializer.save()
        for participant in updated.participants.all():
            try:
                send_event_update_notification_task.send(
                    participant_email=participant.email,
                    participant_name=participant.name,
                    event_name=updated.name,
                    event_uuid=str(updated.uuid)
                )
            except Exception as e:
                logger.error(f"Failed to enqueue update task for participant {participant.email} event {updated.uuid}: {e}")

    def destroy(self, request, *args, **kwargs):
        edit_uuid = kwargs.get('edit_uuid')
        instance = self.get_object()
        if not edit_uuid or str(instance.edit_uuid) != str(edit_uuid):
             raise Http404

        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        participants = list(instance.participants.all())
        name = instance.name
        instance.delete()
        for participant in participants:
            try:
                send_event_cancellation_notification_task.send(
                    participant_email=participant.email,
                    participant_name=participant.name,
                    event_name=name
                )
            except Exception as e:
                logger.error(f"Failed to enqueue cancellation task for participant {participant.email} event {instance.uuid}: {e}")

    def retrieve(self, request, *args, **kwargs):
        edit_uuid = kwargs.get('edit_uuid')
        instance = self.get_object()
        if not edit_uuid or str(instance.edit_uuid) != str(edit_uuid):
             raise Http404
        return super().retrieve(request, *args, **kwargs)

    @action(methods=['delete'], detail=False)
    def remove_participant(self, request, id, edit_uuid, format=None):
        participant = get_object_or_404(Participant, id=id)
        if str(participant.event.edit_uuid) != str(edit_uuid):
            raise Http404
        participant.delete()
        return Response(status=204)


class InvitationViewSet(mixins.CreateModelMixin,
                        mixins.RetrieveModelMixin,
                        viewsets.GenericViewSet):

    queryset = Invitation.objects.all()
    lookup_field = 'uuid'

    def get_serializer_class(self):
        if self.action == 'accept':
            return InvitationAcceptSerializer
        if self.action == 'retrieve':
            return InvitationDetailsSerializer
        return InvitationCreateSerializer

    @action(methods=['DELETE'], detail=False, url_path='remove/(?P<uuid>[^/.]+)/(?P<edit_uuid>[^/.]+)')
    def remove(self, request, uuid, edit_uuid):
        invitation = get_object_or_404(Invitation, uuid=uuid)
        if str(invitation.event.edit_uuid) != str(edit_uuid):
            raise Http404
        invitation.delete()
        return Response(status=204)

    @action(methods=['POST'], detail=False)
    def accept(self, request, format=None):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class PersonalizedInvitationViewSet(mixins.CreateModelMixin,
                        mixins.RetrieveModelMixin,
                        viewsets.GenericViewSet):

    queryset = PersonalizedInvitation.objects.all()
    lookup_field = 'uuid'

    def get_serializer_class(self):
        if self.action == 'accept':
            return PersInvAcceptSerializer
        if self.action == 'retrieve':
            return PersInvDetailsSerializer
        return PersInvCreateSerializer

    @action(methods=['DELETE'], detail=False, url_path='remove/(?P<uuid>[^/.]+)/(?P<edit_uuid>[^/.]+)')
    def remove(self, request, uuid, edit_uuid):
        invitation = get_object_or_404(PersonalizedInvitation, uuid=uuid)
        if str(invitation.event.edit_uuid) != str(edit_uuid):
            raise Http404
        invitation.delete()
        return Response(status=204)

    @action(methods=['POST'], detail=False)
    def accept(self, request, format=None):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class EventViewSet(mixins.RetrieveModelMixin,
                   viewsets.GenericViewSet):

    queryset = Event.objects.all()
    lookup_field = 'uuid'
    serializer_class = EventSerializer

    @extend_schema(
        summary="Download event as ICS file",
        description="Returns an iCalendar (.ics) file for the given event UUID.",
        parameters=[
            OpenApiParameter(
                name='uuid',
                description='UUID of the event',
                required=True,
                type=str,
                location=OpenApiParameter.PATH
            )
        ],
        responses={
            200: OpenApiResponse(
                response=None,
                description='ICS calendar file for the event'
            ),
            404: OpenApiResponse(description='Event not found'),
        },
    )
    @action(methods=['GET'], detail=False, url_path='ics/(?P<uuid>[^/.]+)')
    def convert_to_ics(self, request, uuid, format=None):
        event = self.get_object()
        ics_content = event_to_ics(event)
        response = HttpResponse(ics_content, content_type='text/calendar')
        response['Content-Disposition'] = f'attachment; filename="{event.name}.ics"'
        return response

    @action(methods=['DELETE'], detail=False, url_path='leave/(?P<uuid>[^/.]+)')
    def leave(self, request, uuid, format=None):
        participant = get_object_or_404(Participant, uuid=uuid)
        participant.delete()
        return Response(status=204)


class CommentViewSet(mixins.CreateModelMixin,
                     viewsets.GenericViewSet):

    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    @action(methods=['GET'], detail=False, url_path='(?P<event_uuid>[^/.]+)')
    def list_by_event(self, request, event_uuid, format=None):
        event = get_object_or_404(Event, uuid=event_uuid)
        comments = event.comments.filter(parent__isnull=True)
        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)

    @action(methods=['DELETE'], detail=False,
            url_path='remove/(?P<comment_uuid>[^/.]+)/(?P<participant_or_event_edit_uuid>[^/.]+)')
    def remove(self, request, comment_uuid, participant_or_event_edit_uuid):
        comment = get_object_or_404(Comment, uuid=comment_uuid)
        if str(comment.event.edit_uuid) != str(participant_or_event_edit_uuid) \
            and str(comment.author.uuid) != str(participant_or_event_edit_uuid):
                raise Http404
        comment.delete()
        return Response(status=204)


def test_email_view(request):
    recipient_email = '' # enter test email here
    name = "John"
    surname = "Doe"
    event_details = {
        'name': "Dni pomidora w Szczebodzicach",
        'date': date.today(),
        'event_link': "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
    try:
        send_event_invite_email_task(recipient_email, name, surname, event_details)
        return HttpResponse("Invite email sent successfully!")
    except Exception as e:
        return HttpResponse(f"Error sending email: {e}") # For debugging purposes
