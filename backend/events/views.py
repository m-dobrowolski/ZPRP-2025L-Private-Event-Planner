import logging
from datetime import date

from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import Http404, HttpResponse
from .serializers import EventSerializer, InvitationSerializer, PersonalizedInvitationSerializer,\
                         AcceptInvitationSerializer, AcceptPersonalizedInvitationSerializer,\
                         EventAdminSerializer, EventSerializer
from .models import Event, Invitation, PersonalizedInvitation, Participant
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

class EventCreate(APIView):
    serializer_class = EventAdminSerializer

    def post(self, request, format=None):
        serializer = EventAdminSerializer(data=request.data)
        if serializer.is_valid():
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
                pass

            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class EventAdminDetail(APIView):
    serializer_class = EventAdminSerializer

    def get_object(self, uuid, edit_uuid):
        try:
            event = Event.objects.get(uuid=uuid)
            if str(event.edit_uuid) != str(edit_uuid):
                raise Http404
            return event
        except Event.DoesNotExist:
            raise Http404

    def get(self, request, uuid, edit_uuid, format=None):
        event = self.get_object(uuid, edit_uuid)
        serializer = EventAdminSerializer(event)
        return Response(serializer.data, status=200)

    def patch(self, request, uuid, edit_uuid, format=None):
        event = self.get_object(uuid, edit_uuid)
        serializer = EventAdminSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            updated_event = serializer.save()
            participants = updated_event.participants.all()
            for participant in participants:
                try:
                    send_event_update_notification_task.send(
                        participant_email=participant.email,
                        participant_name=participant.name,
                        event_name=updated_event.name,
                        event_uuid=str(updated_event.uuid)
                    )
                except Exception as e:
                    logger.error(f"Failed to enqueue update task for participant {participant.email} event {updated_event.uuid}: {e}")

            return Response(serializer.data, status=200)
        return Response(serializer.errors, status=400)

    def delete(self, request, uuid, edit_uuid, format=None):
        event = self.get_object(uuid, edit_uuid)
        event.delete()
        return Response(status=204)

class EventDetail(APIView):
    serializer_class = EventSerializer

    def get_object(self, uuid):
        try:
            return Event.objects.get(uuid=uuid)
        except Event.DoesNotExist:
            raise Http404

    def get(self, request, uuid, format=None):
        event = self.get_object(uuid)
        serializer = EventSerializer(event)
        return Response(serializer.data, status=200)


class InvitationCreate(APIView):
    serializer_class = InvitationSerializer

    def post(self, request, format=None):
        serializer = InvitationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class InvitationAccept(APIView):
    serializer_class = AcceptInvitationSerializer

    def post(self, request, format=None):
        serializer = AcceptInvitationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class InvitationDelete(APIView):

    def get_object(self, uuid, edit_uuid):
        try:
            invitation = Invitation.objects.get(uuid=uuid)
            if str(invitation.event.edit_uuid) != str(edit_uuid):
                raise Http404
            return invitation
        except Invitation.DoesNotExist:
            raise Http404

    def delete(self, request, uuid, edit_uuid, format=None):
        invitation = self.get_object(uuid, edit_uuid)
        invitation.delete()
        return Response(status=204)


class PersonalizedInvitationCreate(APIView):
    serializer_class = PersonalizedInvitationSerializer

    def post(self, request, format=None):
        serializer = PersonalizedInvitationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class PersonalizedInvitationAccept(APIView):
    serializer_class = AcceptPersonalizedInvitationSerializer

    def post(self, request, format=None):
        serializer = AcceptPersonalizedInvitationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class PersonalizedInvitationDelete(APIView):

    def get_object(self, uuid, edit_uuid):
        try:
            invitation = PersonalizedInvitation.objects.get(uuid=uuid)
            if str(invitation.event.edit_uuid) != str(edit_uuid):
                raise Http404
            return invitation
        except PersonalizedInvitation.DoesNotExist:
            raise Http404

    def delete(self, request, uuid, edit_uuid, format=None):
        invitation = self.get_object(uuid, edit_uuid)
        invitation.delete()
        return Response(status=204)


class LeaveEvent(APIView):
    def get_object(self, uuid):
        try:
            return Participant.objects.get(uuid=uuid)
        except Participant.DoesNotExist:
            raise Http404

    def delete(self, request, uuid, format=None):
        participant = self.get_object(uuid)
        participant.delete()
        return Response(status=204)


class DeleteParticipantAsAdmin(APIView):
    def get_object(self, id, edit_uuid):
        try:
           participant = Participant.objects.get(id=id)
        except Participant.DoesNotExist:
            raise Http404
        if str(participant.event.edit_uuid) != str(edit_uuid):
            raise Http404
        return participant

    def delete(self, request, id, edit_uuid, format=None):
        participant = self.get_object(id, edit_uuid)
        participant.delete()
        return Response(status=204)


class EventICSDownloadView(APIView):
    def get_object(self, uuid):
        try:
            return Event.objects.get(uuid=uuid)
        except Event.DoesNotExist:
            raise Http404

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
    def get(self, request, uuid, format=None):
        event = self.get_object(uuid)
        ics_content = event_to_ics(event)
        response = HttpResponse(ics_content, content_type='text/calendar')
        response['Content-Disposition'] = f'attachment; filename="{event.name}.ics"'
        return response

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
