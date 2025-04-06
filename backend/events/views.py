import os

from django.core.mail import send_mail
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import Http404, HttpResponse
from .serializers import EventCreateSerializer, EventWithParticipantsSerializer


class EventCreateView(APIView):

    def post(self, request, format=None):
        serializer = EventCreateSerializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save()
            event_serializer = EventWithParticipantsSerializer(event)
            return Response(event_serializer.data, status=201)
        return Response(serializer.errors, status=400)

def test_email_view(request):
    subject = 'Test Email from Django'
    message = 'This is a test email sent from your Django application.'
    from_email = 'noreply@eventplanner.com'
    recipient_list = ['marcin2004pl@gmail.com']
    try:
        send_mail(subject, message, from_email, recipient_list)
        return HttpResponse("Test email sent successfully!")
    except Exception as e:
        return HttpResponse(f"Error sending email: {e}") # For debugging purposes
