from django.urls import path
from events import views

app_name = 'events'

urlpatterns = [
    path('events/', views.EventCreate.as_view(), name='event-list'),
    path('event/<uuid:uuid>/<uuid:edit_uuid>/', views.EventAdminDetail.as_view(), name='event-admin-detail'),
    path('event/<uuid:uuid>/', views.EventDetail.as_view(), name='event-detail'),
    path('invitations/', views.InvitationCreate.as_view(), name='invitation-list'),
    path('invitations/accept/', views.InvitationAccept.as_view(), name='accept-invitation'),
    path('invitation/<uuid:uuid>/<uuid:edit_uuid>/', views.InvitationDelete.as_view(), name='invitation-delete'),
    path('personalized-invitations/', views.PersonalizedInvitationCreate.as_view(), name='personalized-invitation-list'),
    path('personalized-invitations/accept/', views.PersonalizedInvitationAccept.as_view(), name='accept-personalized-invitation'),
    path('personalized-invitation/<uuid:uuid>/<uuid:edit_uuid>/', views.PersonalizedInvitationDelete.as_view(), name='personalized-invitation-delete'),
    path('participant/<uuid:uuid>/', views.ParticipantDetail.as_view(), name='participant-detail'),
    path('participant/<int:id>/<uuid:edit_uuid>/', views.DeleteParticipantAsAdmin.as_view(), name='delete-participant-admin'),
]