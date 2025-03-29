from django.contrib import admin
from .models import Event, Participant

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('id', 'uuid', 'name', 'location', 'start_datetime',
                    'end_datetime', 'organizer_email')

@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('id', 'event', 'name', 'password_hash', 'email', 'is_admin')

