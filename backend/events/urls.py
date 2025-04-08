from django.urls import path
from events import views

app_name = 'events'

urlpatterns = [
    path('event/create/', views.EventCreate.as_view(), name='event-create'),
    path('event/<uuid:uuid>/<uuid:edit_uuid>/', views.EventAdminDetail.as_view(), name='event-admin-detail'),
    path('event/<uuid:uuid>/', views.EventDetail.as_view(), name='event-detail'),
    path('invitation/create/', views.InvitationCreate.as_view(), name='invitation-create'),
    path('invitation/accept/', views.InvitationAccept.as_view(), name='invitation-accept'),
    path('invitation/delete/<uuid:uuid>/<uuid:edit_uuid>/', views.InvitationDelete.as_view(), name='invitation-delete'),
    path('personalized-invitation/create/', views.PersonalizedInvitationCreate.as_view(), name='personalized-invitation-create'),
    path('personalized-invitation/accept/', views.PersonalizedInvitationAccept.as_view(), name='personalized-invitation-accept'),
    path('personalized-invitation/delete/<uuid:uuid>/<uuid:edit_uuid>/', views.PersonalizedInvitationDelete.as_view(), name='personalized-invitation-delete'),
    path('participant/<uuid:uuid>/', views.LeaveEvent.as_view(), name='leave-event'),
    path('participant/<int:id>/<uuid:edit_uuid>/', views.DeleteParticipantAsAdmin.as_view(), name='delete-participant-admin'),
]