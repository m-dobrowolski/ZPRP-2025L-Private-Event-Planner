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
        return await response.json();
    } catch (error) {
        console.error("API Fetch Error:", url, error);
        throw error;
    }
}

async function sendData(url, method, body) {
    try {
        const options = {
            method: method,
            body: body,
        };

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

        const text = await response.text();
        if (text.length === 0) {
            return null;
        }
        try {
            return JSON.parse(text);
        } catch (e) {
            console.warn("API response was not JSON:", text);
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

// New: Delete event
export async function deleteEvent(uuid, editUuid) {
    return fetchData(`event/${uuid}/${editUuid}/`, { method: 'DELETE' });
}