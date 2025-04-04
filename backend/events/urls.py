from django.urls import path
from events import views

app_name = 'events'

urlpatterns = [
    path('events/', views.EventCreateView.as_view(), name='event-list'),
    path('event/<uuid:uuid>/<uuid:edit_uuid>/', views.EventAdminDetailView.as_view(), name='event-admin-detail'),
    path('event/<uuid:uuid>/', views.EventDetailView.as_view(), name='event-detail'),
    path('invitations/', views.InvitationListView.as_view(), name='invitation-list'),
    path('invitations/accept/', views.AcceptInvitationView.as_view(), name='accept-invitation'),
    path('personalized-invitations/', views.PersonalizedInvitationView.as_view(), name='personalized-invitation-list'),
    path('personalized-invitations/accept/', views.AcceptPersonalizedInvitationView.as_view(), name='accept-personalized-invitation'),
    path('participant/<uuid:uuid>/', views.ParticipantDetailView.as_view(), name='participant-detail'),
    path('participant/<int:id>/<uuid:edit_uuid>/', views.DeleteParticipantAsAdminView.as_view(), name='delete-participant-admin'),
]