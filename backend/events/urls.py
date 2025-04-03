from django.urls import path
from events import views

app_name = 'events'

urlpatterns = [
    path('events/', views.EventCreateView.as_view(), name='event-list'),
    path('invitations/', views.InvitationListView.as_view(), name='invitation-list'),

]