const API_BASE_URL = "http://localhost:8000/api/";

async function fetchData(url, options = {}) {
    try {
        const response = await fetch(API_BASE_URL + url, options);
        if (!response.ok) {
            let errorDetail = `API error: ${response.status}`;
            try {
                const errorBody = await response.json();
                errorDetail = errorBody.detail || JSON.stringify(errorBody);
            } catch(e) {
                // ignore error parsing error
            }
            throw new Error(errorDetail);
        }
        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else if (contentType && contentType.includes("text/calendar")) {
            return await response.text(); // Handle text/calendar response
        } else {
            const text = await response.text();
            if (text.length === 0) {
                return null;
            }
            console.warn("API response was not JSON:", url, text);
            return text;
        }
    } catch (error) {
        console.error("API Fetch Error:", url, error);
        throw error;
    }
}

async function sendData(url, method, body) {
    const options = {
        method: method,
    };

    if ((method === 'POST' || method === 'PATCH') && !(body instanceof FormData)) {
        options.body = JSON.stringify(body);
        options.headers = {
            'Content-Type': 'application/json'
        };
    } else {
        options.body = body;
    }

    try {
        const response = await fetch(API_BASE_URL + url, options);

        if (!response.ok) {
            let errorDetail = `API error: ${response.status}`;
            try {
                const errorBody = await response.json();
                errorDetail = errorBody.detail || JSON.stringify(errorBody);
            } catch(e) {
                // ignore error parsing error
            }
            const error = new Error(errorDetail);
            error.response = response;
            throw error;
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else {
            const text = await response.text();
            if (text.length === 0) {
                return null;
            }
            console.warn("API response was not JSON:", url, text);
            return text;
        }

    } catch (error) {
        console.error("API Send Data Error:", url, method, error);
        throw error;
    }
}

export async function createEvent(formData) {
    return sendData('event/create/', 'POST', formData);
}

export async function getEventDetails(uuid) {
    return fetchData(`event/${uuid}/`);
}

export async function getEventAdminDetails(uuid, editUuid) {
    return fetchData(`event/${uuid}/${editUuid}/`);
}

export async function updateEvent(uuid, editUuid, formData) {
    return sendData(`event/${uuid}/${editUuid}/`, 'PATCH', formData);
}

export async function deleteEvent(uuid, editUuid) {
    return fetchData(`event/${uuid}/${editUuid}/`, { method: 'DELETE' });
}

export async function deleteParticipantAsAdmin(participantId, editUuid) {
    return fetchData(`participant/${participantId}/${editUuid}/`, {method: 'DELETE'});
}

export async function createUniversalInvitation(eventUuid, editUuid) {
    const body = {
        event: eventUuid,
        event_edit_uuid: editUuid
    };
    return sendData('invitation/create/', 'POST', body);
}

export async function deleteUniversalInvitation(invitationUuid, editUuid) {
    return fetchData(`invitation/delete/${invitationUuid}/${editUuid}/`, { method: 'DELETE' });
}

export async function acceptUniversalInvitation(invitationUuid, name, email) {
    const body = {
        invitation: invitationUuid,
        name: name,
        email: email
    };
    return sendData('invitation/accept/', 'POST', body)
}

export async function getUniversalInvitationDetails(invitationUuid) {
     return fetchData(`invitation/details/${invitationUuid}/`);
}

export async function createPersonalizedInvitation(eventUuid, editUuid, name) {
    const body = {
        event: eventUuid,
        event_edit_uuid: editUuid,
        name: name,
    };
    return sendData('personalized-invitation/create/', 'POST', body);
}

export async function deletePersonalizedInvitation(invitationUuid, editUuid) {
    return fetchData(`personalized-invitation/delete/${invitationUuid}/${editUuid}/`, { method: 'DELETE' });
}

export async function acceptPersonalizedInvitation(invitationUuid, name, email) {
    const body = {
        invitation: invitationUuid,
        name: name,
        email: email
    };
     return sendData(`personalized-invitation/accept/`, 'POST', body);
}

export async function getPersonalizedInvitationDetails(invitationUuid) {
     return fetchData(`personalized-invitation/details/${invitationUuid}/`);
}

export async function createComment(eventUuid, participantOrEventEditUuid, content) {
    const body = {
        event: eventUuid,
        author_uuid: participantOrEventEditUuid,
        content: content
    };
    return sendData('comments/create/', 'POST', body);
}

export async function getComments(eventUuid) {
    return fetchData(`comments/${eventUuid}/`);
}

export async function deleteComment(commentUuid, participantOrEventEditUuid) {
    return fetchData(`comments/delete/${commentUuid}/${participantOrEventEditUuid}`, { method: 'DELETE' });
}

export async function getEventIcs(eventUuid) {
    return fetchData(`event/ics/${eventUuid}/`, {method: 'GET'});
}