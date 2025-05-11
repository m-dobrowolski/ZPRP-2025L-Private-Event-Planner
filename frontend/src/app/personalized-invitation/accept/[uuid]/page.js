'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { acceptPersonalizedInvitation, getPersonalizedInvitationDetails } from '@/api/api';
import styles from '@/styles/acceptInvitation.module.css';

export default function AcceptPersonalizedInvitationPage() {
    const params = useParams();
    const invitationUuid = params.uuid;

    const router = useRouter();

    const [formData, setFormData] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [error, setError] = useState(null);
    const [errorDetails, setErrorDetails] = useState(null);
    const [invitationDetails, setInvitationDetails] = useState(null);
    const [eventDetails, setEventDetails] = useState(null);


     useEffect(() => {
         if (!invitationUuid) {
             setLoadingDetails(false);
             setErrorDetails("Invalid invitation UUID.");
             return;
         }

         const fetchInvitationAndEvent = async () => {
             setLoadingDetails(true);
             setErrorDetails(null);

             try {
                 const data = await getPersonalizedInvitationDetails(invitationUuid);

                 if (data) {
                     setInvitationDetails({ name: data.name, uuid: data.uuid });
                     setFormData(prev => ({ ...prev, name: data.name }));
                     setEventDetails({ name: data.event_name, uuid: data.event_uuid });
                 } else {
                     setErrorDetails("Could not find invitation details.");
                 }


             } catch (err) {
                  console.error("Failed to fetch personalized invitation details:", err);
                  const errorMessage = err.response?.data?.detail || err.message || "Could not load invitation details. It might be invalid or already accepted.";
                  setErrorDetails(errorMessage);
             } finally {
                  setLoadingDetails(false);
             }
         };

         fetchInvitationAndEvent();

     }, [invitationUuid]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!invitationDetails) {
             setError("Cannot accept invitation: Details not loaded.");
             setLoading(false);
             return;
        }

        if (!formData.email) {
            setError('Please enter your email to join.');
            setLoading(false);
            return;
        }

        try {
            const response = await acceptPersonalizedInvitation(invitationUuid, formData.name, formData.email);

            console.log('Personalized invitation accepted, participant created:', response);
            alert(`Success! You have joined the event as "${response.name || 'Unnamed Participant'}".`);

            if (response && response.event) {
                router.push(`/event/${response.event}`);
            } else {
                 console.warn("Backend did not return event_uuid on personalized invitation acceptance.");
                 router.push('/');
            }


        } catch (err) {
            console.error('Error accepting personalized invitation:', err);
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to accept invitation. It might be invalid or already used.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    if (!invitationUuid) {
         return <div className={`${styles.container} ${styles.error}`}>Invalid invitation link.</div>;
    }

    if (loadingDetails) {
         return <div className={styles.container}>Loading invitation details...</div>;
    }

    if (errorDetails) {
         return <div className={`${styles.container} ${styles.error}`}>Error loading invitation: {errorDetails}</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Accept Personalized Invitation</h1>

             {eventDetails && (
                 <div className={styles.eventContext}>
                     <p>You've been invited to: <strong>{eventDetails.name}</strong></p>
                 </div>
             )}

            {invitationDetails && (
                 <div className={styles.eventContext}>
                     <p>Invitation for: <strong>{invitationDetails.name}</strong></p>
                 </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            {invitationDetails && eventDetails && (
                 <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                         <label className={styles.label}>Your Name</label>
                         <input
                              type="text"
                              value={invitationDetails.name}
                              className={styles.input}
                              disabled={true}
                         />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Your Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.input}
                            required
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" className={styles.submitButton} disabled={loading || loadingDetails}>
                        {loading ? 'Joining...' : 'Join Event'}
                    </button>
                </form>
            )}
        </div>
    );
}