from django.urls import path
from events import views

app_name = 'events'

urlpatterns = [
    path('create/', views.EventCreateView.as_view(), name='event-create'),
]