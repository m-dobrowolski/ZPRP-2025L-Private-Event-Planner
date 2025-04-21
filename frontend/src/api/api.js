const API_BASE_URL = "http://localhost:8000";

export const createEvent = async (eventData) => {
    const response = await fetch(`${API_BASE_URL}/api/event/create/`, {
        mode: 'cors',
        method: 'POST',
        body: eventData,
    });

    if (!response.ok) {
        throw new Error('Failed to create event');
    }

    return response.json();
};