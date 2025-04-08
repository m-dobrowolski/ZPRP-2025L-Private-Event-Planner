from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from events.factories import EventFactory
from events.models import Event
from uuid import uuid4

class EventCreateTests(APITestCase):

    def setUp(self):
        self.url = reverse('events:event-create')
        self.event = EventFactory.build()
        self.valid_payload = {
            "name": self.event.name,
            "location": self.event.location,
            "start_datetime": self.event.start_datetime,
            "end_datetime": self.event.end_datetime,
            "organizer_email": self.event.organizer_email,
            "description": self.event.description,
            "link": self.event.link,
            "organizer_name": self.event.organizer_name,
            "participants_limit": self.event.participants_limit
        }

    def test_create_event_successfully(self):
        response = self.client.post(self.url, data=self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Event.objects.count(), 1)
        event = Event.objects.first()
        self.assertEqual(event.name, self.valid_payload['name'])

    def test_create_event_invalid_email(self):
        payload = self.valid_payload.copy()
        payload["organizer_email"] = "not-an-email"
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("organizer_email", response.data)

    def test_create_event_missing_required_field(self):
        payload = self.valid_payload.copy()
        del payload["name"]
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_create_event_with_extra_fields_ignored(self):
        payload = self.valid_payload.copy()
        payload["uuid"] = str(uuid4())
        payload["edit_uuid"] = str(uuid4())
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        event = Event.objects.get()
        self.assertNotEqual(str(event.uuid), payload["uuid"])
        self.assertNotEqual(str(event.edit_uuid), payload["edit_uuid"])
