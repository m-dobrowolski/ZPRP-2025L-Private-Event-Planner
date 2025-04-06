import os
from datetime import date

from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import Http404, HttpResponse
from .serializers import EventCreateSerializer, EventWithParticipantsSerializer
from .emails import send_event_invite_email_sync


class EventCreateView(APIView):

    def post(self, request, format=None):
        serializer = EventCreateSerializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save()
            event_serializer = EventWithParticipantsSerializer(event)
            return Response(event_serializer.data, status=201)
        return Response(serializer.errors, status=400)

def test_email_view(request):
    recipient_email = '' # enter test email here
    name = "John"
    surname = "Doe"
    event_details = {
        'name': name,
        'date': date.today(),
        'event_link': "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
    try:
        send_event_invite_email_sync(recipient_email, name, surname, event_details)
        return HttpResponse("Invite email sent successfully!")
    except Exception as e:
        return HttpResponse(f"Error sending email: {e}") # For debugging purposes
