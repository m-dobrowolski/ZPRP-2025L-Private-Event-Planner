'use client';

import { useState, useEffect } from 'react';
import { acceptPersonalizedInvitation, getPersonalizedInvitationDetails } from '@/api/api';
import styles from '@/styles/acceptInvitation.module.css';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useParams } from "next/navigation";

export default function AcceptPersonalizedInvitationClient({ invitationUuid }) {
    const params = useParams();
    const currentLocale = params.locale;

    const { t } = useTranslation('translation');

    const [formData, setFormData] = useState({ name: '', email: '' }); 
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [error, setError] = useState(null);
    const [errorDetails, setErrorDetails] = useState(null);
    const [invitationDetails, setInvitationDetails] = useState(null);
    const [eventDetails, setEventDetails] = useState(null);
    const [success, setSuccess] = useState(null);


    useEffect(() => {
        if (!invitationUuid) {
            setLoadingDetails(false);
            setErrorDetails(t('invalid_invitation_uuid_error'));
            return;
        }

        const fetchInvitationAndEvent = async () => {
            setLoadingDetails(true);
            setErrorDetails(null);
            try {
                const data = await getPersonalizedInvitationDetails(invitationUuid);

                if (data) {
                    setInvitationDetails({ name: data.name, uuid: data.uuid });
                    setFormData(prev => ({ ...prev, name: data.name || '' }));
                    setEventDetails({ name: data.event_name, uuid: data.event_uuid });
                } else {
                    setErrorDetails(t('personalized_invitation_not_found_error'));
                }

            } catch (err) {
                console.error("Failed to fetch personalized invitation details:", err);
                const errorMessage = err.response?.data?.detail || err.message || t('load_personalized_failed_error');
                setErrorDetails(errorMessage);
            } finally {
                setLoadingDetails(false);
            }
        };

        fetchInvitationAndEvent();
    }, [invitationUuid, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!invitationDetails) {
            setError(t('cannot_accept_details_not_loaded_error'));
            setLoading(false);
            return;
        }

        if (!formData.email.trim()) { 
            setError(t('your_email_required_error')); 
            setLoading(false);
            return;
        }

        try {
            const response = await acceptPersonalizedInvitation(invitationUuid, invitationDetails.name, formData.email.trim());
            console.log('Personalized invitation accepted, participant created:', response);
            setSuccess({
                name: response.name,
                uuid: response.uuid
            });

        } catch (err) {
            console.error('Error accepting personalized invitation:', err);
            const errorMessage = t('accept_personalized_failed_error');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loadingDetails) {
         return <div className={styles.container}>{t('loading_invitation_details')}</div>; 
    }

    if (errorDetails) {
         return <div className={`${styles.container} ${styles.error}`}>{t('error_loading_invitation_prefix')}: {errorDetails}</div>; 
    }

    if (!invitationDetails || !eventDetails) {
        return <div className={`${styles.container} ${styles.error}`}>{t('invalid_or_used_personalized_invitation_error')}</div>; 
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{t('accept_personalized_invitation_title')}</h1>

            {eventDetails && (
                <div className={styles.eventContext}>
                    <p>{t('invited_to_event')} <strong>{ eventDetails.name }</strong></p>
                </div>
            )}

            {invitationDetails && (
                <div className={styles.eventContext}>
                    <p>{t('invitation_for')} <strong>{ invitationDetails.name }</strong></p>
                </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            {success && (
                <div className={styles.success}>
                    <h2> {t('invitation_joined_event_message')} </h2>
                    <p>
                        Your URL: <br />
                        <div className={styles.link}>
                            <Link href={`/${currentLocale}/event/${success.event}?author_uuid=${success.uuid}`}>
                                http://localhost:3000/api/event/{success.event}?author_uuid={success.uuid}
                            </Link>
                        </div>
                    </p>
                    <p className={styles.important}> {t('invitation_save_url_message')} </p>
                </div>
            )}

            {!success && invitationDetails && eventDetails && (
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('your_name_label')}</label>
                        <input
                            type="text"
                            value={invitationDetails.name || ''} 
                            className={styles.input}
                            disabled={true} 
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('your_email_label')}</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.input}
                            required
                            disabled={loading || loadingDetails} 
                        />
                    </div>
                    <button type="submit" className={styles.submitButton} disabled={loading || loadingDetails || !formData.email.trim()}>
                        {loading ? t('joining_button') : t('join_event_button')}
                    </button>
                </form>
            )}
        </div>
    );
}
