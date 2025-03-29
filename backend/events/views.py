from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import Http404
from .serializers import EventCreateSerializer, EventWithParticipantsSerializer


class EventCreateView(APIView):

    def post(self, request, format=None):
        serializer = EventCreateSerializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save()
            event_serializer = EventWithParticipantsSerializer(event)
            return Response(event_serializer.data, status=201)
        return Response(serializer.errors, status=400)
