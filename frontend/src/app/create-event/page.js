'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/api/api';
import styles from './createEvent.module.css';
import Link from 'next/link';

export default function CreateEventPage() {
    const router = useRouter();
    const [successData, setSuccessData] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        start_datetime: '',
        end_datetime: '',
        organizer_email: '',
        description: '',
        link: '',
        image: null,
        organizer_name: '',
        participants_limit: '',
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const formDataToSend = new FormData();
            for (const key in formData) {
                if (formData[key] !== null && formData[key] !== '') {
                    formDataToSend.append(key, formData[key]);
                }
            }

            const res = await createEvent(formDataToSend);
            const { uuid, edit_uuid } = res;
            setSuccessData({ uuid, edit_uuid });
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    if (successData) {
        return (
            <div className={styles.success_container}>
                <h1 className={styles.title}>Event created successfully!</h1>
                <p>Here are the links to access and manage the event. Keep managing link private, it cannot be changed.
                    Links will be sent to your email address shortly.
                </p>

                <div className={styles.link_row}>
                    <div className={styles.link_description}>
                        Link to access event:
                    </div>
                    <div className={styles.link}>
                        <Link href={`/event/${successData.uuid}`}>
                            http://localhost:3000/event/{successData.uuid}
                        </Link>
                    </div>
                </div>

                <div className={styles.link_row}>
                    <div className={styles.link_description}>
                        Link to manage event:
                    </div>
                    <div className={styles.link}>
                        <Link href={`/event/${successData.uuid}/${successData.edit_uuid}`}>
                            http://localhost:3000/event/{successData.uuid}/{successData.edit_uuid}
                        </Link>
                    </div>
                </div>

            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Create New Event</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Event Name*</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={styles.input}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Location*</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className={styles.input}
                        required
                    />
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Start Date & Time*</label>
                        <input
                            type="datetime-local"
                            name="start_datetime"
                            value={formData.start_datetime}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>End Date & Time*</label>
                        <input
                            type="datetime-local"
                            name="end_datetime"
                            value={formData.end_datetime}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Organizer Email*</label>
                    <input
                        type="email"
                        name="organizer_email"
                        value={formData.organizer_email}
                        onChange={handleChange}
                        className={styles.input}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Organizer Name</label>
                    <input
                        type="text"
                        name="organizer_name"
                        value={formData.organizer_name}
                        onChange={handleChange}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>External Link</label>
                    <input
                        type="url"
                        name="link"
                        value={formData.link}
                        onChange={handleChange}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Event Image</label>
                    <input
                        type="file"
                        name="image"
                        onChange={handleChange}
                        className={styles.fileInput}
                        accept="image/*"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Participants Limit</label>
                    <input
                        type="number"
                        name="participants_limit"
                        value={formData.participants_limit}
                        onChange={handleChange}
                        className={styles.input}
                        min="1"
                    />
                </div>


                <button type="submit" className={styles.submitButton}>
                    Create Event
                </button>
            </form>
        </div>
    );
}