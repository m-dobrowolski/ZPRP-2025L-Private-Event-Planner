from django.contrib import admin
from .models import Event, Participant

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('id', 'uuid', 'edit_uuid', 'name', 'location', 'start_datetime',
                    'end_datetime', 'organizer_email')

@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('id', 'uuid', 'event', 'name', 'email')

