from django.urls import path
from .views import test_email_view, EventCreateView

app_name = 'events'

urlpatterns = [
    path('create/', EventCreateView.as_view(), name='event-create'),
    path('test_email/', test_email_view, name='test_email'),

]