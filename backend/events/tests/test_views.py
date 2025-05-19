from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from events.factories import EventFactory, ParticipantFactory, InvitationFactory, PersonalizedInvitationFactory
from events.models import Event, Invitation, PersonalizedInvitation, Participant
from uuid import uuid4

class EventCreateTests(APITestCase):

    def setUp(self):
        self.url = reverse('events:event-admin-list')
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

    def test_create_event_invalid_participants_limit(self):
        payload = self.valid_payload.copy()
        payload["participants_limit"] = -1
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("participants_limit", response.data)

    def test_create_event_with_extra_fields_ignored(self):
        payload = self.valid_payload.copy()
        payload["uuid"] = str(uuid4())
        payload["edit_uuid"] = str(uuid4())
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        event = Event.objects.get()
        self.assertNotEqual(str(event.uuid), payload["uuid"])
        self.assertNotEqual(str(event.edit_uuid), payload["edit_uuid"])


class EventAdminDetailTests(APITestCase):
    def setUp(self):
        self.event = EventFactory()
        participant1 = ParticipantFactory(event=self.event)
        participant2 = ParticipantFactory(event=self.event)
        self.uuid = str(self.event.uuid)
        self.edit_uuid = str(self.event.edit_uuid)

    def test_get_event_admin_detail(self):
        url = reverse('events:event-admin-detail', args=[self.uuid, self.edit_uuid])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['uuid'], self.uuid)
        self.assertEqual(response.data['edit_uuid'], self.edit_uuid)

    def test_get_event_admin_detail_invalid_edit_uuid(self):
        invalid_edit_uuid = str(str(uuid4()))
        url = reverse('events:event-admin-detail', args=[self.uuid, invalid_edit_uuid])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_event_admin_detail(self):
        url = reverse('events:event-admin-detail', args=[self.uuid, self.edit_uuid])

        data = {"name": "Updated Event Name"}
        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Updated Event Name")
        self.event.refresh_from_db()
        self.assertEqual(self.event.name, "Updated Event Name")

    def test_patch_event_admin_detail_invalid_participants_limit(self):
        url = reverse('events:event-admin-detail', args=[self.uuid, self.edit_uuid])

        data = {"participants_limit": 1}
        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("participants_limit", response.data)

    def test_patch_event_admin_detail_invalid_date(self):
        url = reverse('events:event-admin-detail', args=[self.uuid, self.edit_uuid])

        data = {"start_datetime": self.event.end_datetime, "end_datetime": self.event.start_datetime}
        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_event_admin_detail(self):
        url = reverse('events:event-admin-detail', args=[self.uuid, self.edit_uuid])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        with self.assertRaises(Event.DoesNotExist):
            Event.objects.get(uuid=self.uuid)


class EventDetailsTests(APITestCase):
    def setUp(self):
        self.event = EventFactory()
        self.uuid = str(self.event.uuid)

    def test_get_event_details(self):
        url = reverse('events:event-detail', args=[self.uuid])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['uuid'], self.uuid)
        self.assertEqual(response.data['name'], self.event.name)
        self.assertEqual(response.data.get('edit_uuid'), None)

    def test_get_event_details_invalid_uuid(self):
        invalid_uuid = str(uuid4())
        url = reverse('events:event-detail', args=[invalid_uuid])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class InvitationCreateTests(APITestCase):
    def setUp(self):
        self.url = reverse('events:invitation-list')
        self.event = EventFactory()

    def test_create_invitation_successfully(self):
        payload = {
            "event": str(self.event.uuid),
            "event_edit_uuid": str(self.event.edit_uuid)
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(str(response.data['event']), payload['event'])
        self.assertTrue(self.event.invitations.filter(uuid=response.data['uuid']).exists())

    def test_invalid_edit_uuid(self):
        payload = {
            "event": str(self.event.uuid),
            "event_edit_uuid": str(uuid4())
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Event edit uuid does not match", str(response.data))


class InvitationAcceptTests(APITestCase):
    def setUp(self):
        self.url = reverse('events:invitation-accept')
        self.event = EventFactory()
        self.invitation = InvitationFactory(event=self.event)

    def test_accept_invitation_successfully(self):
        payload = {
            "invitation": str(self.invitation.uuid),
            "name": "John Doe",
            "email": "john@example.com"
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(str(self.event.uuid), str(response.data['event']))
        self.assertEqual(payload['name'], response.data['name'])
        self.assertEqual(payload['email'], response.data['email'])
        self.assertTrue(self.event.participants.filter(uuid=response.data['uuid']).exists())

    def test_invalid_invitation(self):
        payload = {
            "invitation": str(uuid4()),
            "name": "John Doe",
            "email": "example@example.com"
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invitation", str(response.data))

    def test_no_email(self):
        payload = {
            "invitation": str(self.invitation.uuid),
            "name": "John Doe",
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", str(response.data))

    def test_email_already_used(self):
        existing_participant = ParticipantFactory(event=self.event)
        payload = {
            "invitation": str(self.invitation.uuid),
            "name": "John Doe",
            "email": existing_participant.email
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Participant with this email already exists in this event.", str(response.data))


class InvitationDeleteTests(APITestCase):
    def setUp(self):
        self.event = EventFactory()
        self.invitation = InvitationFactory(event=self.event)
        self.url = reverse('events:invitation-detail', args=[self.invitation.uuid, self.event.edit_uuid])

    def test_delete_invitation_successfully(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(Invitation.DoesNotExist):
            Invitation.objects.get(uuid=self.invitation.uuid)

    def test_delete_invitation_invalid_edit_uuid(self):
        invalid_edit_uuid = str(uuid4())
        url = reverse('events:invitation-detail', args=[self.invitation.uuid, invalid_edit_uuid])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class PersonalizedInvitationCreateTests(APITestCase):
    def setUp(self):
        self.url = reverse('events:personalized-invitation-list')
        self.event = EventFactory()

    def test_create_invitation_successfully(self):
        payload = {
            "event": str(self.event.uuid),
            "event_edit_uuid": str(self.event.edit_uuid),
            "name": "John Doe",
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(str(response.data['event']), payload['event'])
        self.assertEqual(payload['name'], response.data['name'])
        self.assertTrue(self.event.personalized_invitations.filter(uuid=response.data['uuid']).exists())

    def test_invalid_edit_uuid(self):
        payload = {
            "event": str(self.event.uuid),
            "event_edit_uuid": str(uuid4()),
            "name": "John Doe",
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Event edit uuid does not match", str(response.data))


class PersonalizedInvitationAcceptTests(APITestCase):
    def setUp(self):
        self.url = reverse('events:personalized-invitation-accept')
        self.event = EventFactory()
        self.invitation = PersonalizedInvitationFactory(event=self.event)

    def test_accept_invitation_successfully(self):
        payload = {
            "invitation": str(self.invitation.uuid),
            "email": "john@example.com"
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(str(self.event.uuid), str(response.data['event']))
        self.assertEqual(self.invitation.name, response.data['name'])
        self.assertEqual(payload['email'], response.data['email'])
        self.assertTrue(self.event.participants.filter(uuid=response.data['uuid']).exists())

    def test_invalid_invitation(self):
        payload = {
            "invitation": str(uuid4()),
            "email": "example@example.com"
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invitation", str(response.data))

    def test_no_email(self):
        payload = {
            "invitation": str(self.invitation.uuid),
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", str(response.data))

    def test_email_already_used(self):
        existing_participant = ParticipantFactory(event=self.event)
        payload = {
            "invitation": str(self.invitation.uuid),
            "email": existing_participant.email
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Participant with this email already exists in this event.", str(response.data))

    def test_ignore_given_name(self):
        payload = {
            "invitation": str(self.invitation.uuid),
            "email": "john@example.com",
            "name": "X"*10
        }
        response = self.client.post(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(payload['name'], response.data['name'])
        self.assertEqual(self.invitation.name, response.data['name'])
        self.assertTrue(self.event.participants.filter(uuid=response.data['uuid']).exists())


class InvitationDeleteTests(APITestCase):
    def setUp(self):
        self.event = EventFactory()
        self.invitation = PersonalizedInvitationFactory(event=self.event)

    def test_delete_invitation_successfully(self):
        url = reverse('events:personalized-invitation-remove', args=[self.invitation.uuid, self.event.edit_uuid])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(PersonalizedInvitation.DoesNotExist):
            PersonalizedInvitation.objects.get(uuid=self.invitation.uuid)

    def test_delete_invitation_invalid_edit_uuid(self):
        invalid_edit_uuid = str(uuid4())
        url = reverse('events:personalized-invitation-remove', args=[self.invitation.uuid, invalid_edit_uuid])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class LeaveEventTests(APITestCase):
    def setUp(self):
        self.event = EventFactory()
        self.participant = ParticipantFactory(event=self.event)

    def test_leave_event_successfully(self):
        url = reverse('events:event-leave', args=[self.participant.uuid])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(Participant.DoesNotExist):
            Participant.objects.get(uuid=self.participant.uuid)

    def test_leave_event_invalid_uuid(self):
        invalid_uuid = str(uuid4())
        url = reverse('events:event-leave', args=[invalid_uuid])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DeleteParticipantAsAdminTest(APITestCase):
    def setUp(self):
        self.event = EventFactory()
        self.participant = ParticipantFactory(event=self.event)

    def test_delete_participant_successfully(self):
        url = reverse('events:event-admin-remove-participant', args=[self.participant.id, self.event.edit_uuid])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(Participant.DoesNotExist):
            Participant.objects.get(id=self.participant.id)

    def test_delete_participant_invalid_edit_uuid(self):
        invalid_edit_uuid = str(uuid4())
        url = reverse('events:event-admin-remove-participant', args=[self.participant.id, invalid_edit_uuid])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

