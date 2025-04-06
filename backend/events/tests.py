from django.test import TestCase
from django.core import mail
from django.template.loader import render_to_string
from .emails import send_event_invite_email_sync

class UserProfileTaskTest(TestCase):
    def test_send_email(self):
        subject = 'subject'
        body = 'body'
        from_email = 'from_email@test.com'
        recipient_list = ['recipient@test.com']
        mail.send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=recipient_list
        )
        self.assertEqual(len(mail.outbox), 1)

class EmailSendingTest(TestCase):

    def test_send_event_invite_email_sync(self):
        """
        Tests the synchronous email sending function.
        """
        mail.outbox = []
        test_email = "test@example.com"
        test_name = "Jane"
        test_surname = "Smith"
        test_event_details = {
            'name': 'Another Event',
            'date': '2024-02-20 14:00',
            'event_link': 'test12345',
        }

        send_event_invite_email_sync(test_email, test_name, test_surname, test_event_details)

        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, [test_email])
        self.assertEqual(sent_email.subject, "Invitation: Another Event")
        expected_text_content = render_to_string('invite_email.txt', {
            'name': test_name,
            'surname': test_surname,
            'event_name': test_event_details['name'],
            'event_date': test_event_details['date'],
            'event_link': test_event_details['event_link'],
        })
        expected_html_content = render_to_string('invite_email.html', {
            'name': test_name,
            'surname': test_surname,
            'event_name': test_event_details['name'],
            'event_date': test_event_details['date'],
            'event_link': test_event_details['event_link'],
        })
        self.assertEqual(sent_email.body.strip(), expected_text_content.strip())
        self.assertEqual(sent_email.alternatives[0][0].strip(), expected_html_content.strip())
        self.assertEqual(sent_email.alternatives[0][1], "text/html")
