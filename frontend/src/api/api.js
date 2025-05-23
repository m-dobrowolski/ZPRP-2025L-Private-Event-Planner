const API_BASE_URL = "http://localhost/api/";

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

    if ((method === 'POST' || method === 'PUT') && !(body instanceof FormData)) {
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
    return sendData('event-admin/', 'POST', formData);
}

export async function getEventDetails(uuid) {
    return fetchData(`event/${uuid}/`);
}

export async function getEventAdminDetails(uuid, editUuid) {
    return fetchData(`event-admin/${uuid}/${editUuid}/`);
}

export async function updateEvent(uuid, editUuid, formData) {
    return sendData(`event-admin/${uuid}/${editUuid}/`, 'PUT', formData);
}

export async function deleteEvent(uuid, editUuid) {
    return fetchData(`event-admin/${uuid}/${editUuid}/`, { method: 'DELETE' });
}

export async function deleteParticipantAsAdmin(participantId, editUuid) {
    return fetchData(`event-admin/remove-participant/${participantId}/${editUuid}/`, {method: 'DELETE'});
}

export async function createGenericInvitation(eventUuid, editUuid) {
    const body = {
        event: eventUuid,
        event_edit_uuid: editUuid
    };
    return sendData('invitation/', 'POST', body);
}

export async function deleteGenericInvitation(invitationUuid, editUuid) {
    return fetchData(`invitation/remove/${invitationUuid}/${editUuid}/`, { method: 'DELETE' });
}

export async function acceptGenericInvitation(invitationUuid, name, email) {
    const body = {
        invitation: invitationUuid,
        name: name,
        email: email
    };
    return sendData('invitation/accept/', 'POST', body)
}

export async function getGenericInvitationDetails(invitationUuid) {
     return fetchData(`invitation/${invitationUuid}/`);
}

export async function createPersonalizedInvitation(eventUuid, editUuid, name) {
    const body = {
        event: eventUuid,
        event_edit_uuid: editUuid,
        name: name,
    };
    return sendData('personalized-invitation/', 'POST', body);
}

export async function deletePersonalizedInvitation(invitationUuid, editUuid) {
    return fetchData(`personalized-invitation/remove/${invitationUuid}/${editUuid}/`, { method: 'DELETE' });
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
     return fetchData(`personalized-invitation/${invitationUuid}/`);
}

export async function createComment(eventUuid, participantOrEventEditUuid, content) {
    const body = {
        event: eventUuid,
        author_uuid: participantOrEventEditUuid,
        content: content
    };
    return sendData('comment/', 'POST', body);
}

export async function getComments(eventUuid) {
    return fetchData(`comment/${eventUuid}/`);
}

export async function deleteComment(commentUuid, participantOrEventEditUuid) {
    return fetchData(`comment/remove/${commentUuid}/${participantOrEventEditUuid}`, { method: 'DELETE' });
}

export async function getEventIcs(eventUuid) {
    return fetchData(`event/ics/${eventUuid}/`, {method: 'GET'});
}