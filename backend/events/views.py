from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import Http404
from .serializers import EventCreateSerializer, InvitationSerializer, PersonalizedInvitationSerializer,\
                         AcceptInvitationSerializer, AcceptPersonalizedInvitationSerializer,\
                         EventAdminSerializer, EventEditSerializer, EventSerializer,\
                         ParticipantAllSerializer
from .models import Event, Invitation, PersonalizedInvitation, Participant


class EventCreateView(APIView):
    def post(self, request, format=None):
        serializer = EventCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class EventAdminDetailView(APIView):
    def get_object(self, uuid, edit_uuid):
        try:
            event = Event.objects.get(uuid=uuid)
            if str(event.edit_uuid) != str(edit_uuid):
                return Response({"error": "Edit UUID does not match."}, status=400)
            return event
        except Event.DoesNotExist:
            raise Http404

    def get(self, request, uuid, edit_uuid, format=None):
        event = self.get_object(uuid, edit_uuid)
        serializer = EventAdminSerializer(event)
        return Response(serializer.data, status=200)

    def patch(self, request, uuid, edit_uuid, format=None):
        event = self.get_object(uuid, edit_uuid)
        serializer = EventEditSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
        return Response(serializer.errors, status=400)

    def delete(self, request, uuid, edit_uuid, format=None):
        event = self.get_object(uuid, edit_uuid)
        event.delete()
        return Response(status=204)


class EventDetailView(APIView):
    def get_object(self, uuid):
        try:
            return Event.objects.get(uuid=uuid)
        except Event.DoesNotExist:
            raise Http404

    def get(self, request, uuid, format=None):
        event = self.get_object(uuid)
        serializer = EventSerializer(event)
        return Response(serializer.data, status=200)


class InvitationListView(APIView):
    def post(self, request, format=None):
        serializer = InvitationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class PersonalizedInvitationView(APIView):
    def post(self, request, format=None):
        serializer = PersonalizedInvitationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AcceptInvitationView(APIView):
    def post(self, request, format=None):
        serializer = AcceptInvitationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AcceptPersonalizedInvitationView(APIView):
    def post(self, request, format=None):
        serializer = AcceptPersonalizedInvitationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class ParticipantDetailView(APIView):
    def get_object(self, uuid):
        try:
            return Participant.objects.get(uuid=uuid)
        except Participant.DoesNotExist:
            raise Http404

    def get(self, request, uuid, format=None):
        participant = self.get_object(uuid)
        serializer = ParticipantAllSerializer(participant)
        return Response(serializer.data, status=200)

    def delete(self, request, uuid, format=None):
        participant = self.get_object(uuid)
        participant.delete()
        return Response(status=204)


class DeleteParticipantAsAdminView(APIView):
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


