from uuid import uuid4
from django.db import models
from django.utils.timezone import now

class Event(models.Model):
    id = models.AutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    edit_uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    organizer_email = models.EmailField()
    description = models.TextField(blank=True, null=True)
    link = models.URLField(blank=True, null=True)
    image = models.ImageField(upload_to='event_images/', blank=True, null=True)
    organizer_name = models.CharField(max_length=255, blank=True, null=True)
    participants_limit = models.PositiveIntegerField(blank=True, null=True)


class Participant(models.Model):
    id = models.AutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participants')
    name = models.CharField(max_length=255)
    email = models.EmailField()


class Invitation(models.Model):
    id = models.AutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='invitations')


class PersonalizedInvitation(Invitation):
    name = models.CharField(max_length=255)


class Comment(models.Model):
    id = models.AutoField(primary_key=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, related_name='replies', blank=True, null=True)
    author = models.ForeignKey(Participant, on_delete=models.CASCADE)
    content = models.TextField()
    date = models.DateTimeField(auto_now_add=True)