from uuid import uuid4

from django.db import models


class Event(models.Model):
    id = models.AutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    edit_uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    organizer_email = models.EmailField()
    description = models.TextField(blank=True, default="")
    link = models.URLField(blank=True, default="")
    image = models.ImageField(upload_to='event_images/', blank=True, null=True)
    organizer_name = models.CharField(max_length=255, blank=True, default="")
    participants_limit = models.PositiveIntegerField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.start_datetime.strftime('%Y-%m-%d %H:%M')})"


class Participant(models.Model):
    id = models.AutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE,
                              related_name='participants')
    name = models.CharField(max_length=255)
    email = models.EmailField()

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"


class Invitation(models.Model):
    id = models.AutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE,
                              related_name='invitations')

    def __str__(self) -> str:
        return f"Invitation to: {self.event.name}"


class PersonalizedInvitation(models.Model):
    id = models.AutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE,
                              related_name='personalized_invitations')
    name = models.CharField(max_length=255)

    def __str__(self) -> str:
        return f"Invitation for {self.name} to {self.event.name}"

class Comment(models.Model):
    id = models.AutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, related_name='replies',
                               blank=True, null=True)
    author = models.ForeignKey(Participant, on_delete=models.CASCADE)
    content = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Comment by {self.author.name} on \
            {self.date.strftime('%Y-%m-%d %H:%M')}"
