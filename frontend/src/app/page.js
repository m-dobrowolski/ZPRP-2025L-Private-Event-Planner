'use client';

import Image from "next/image"
import styles from "./page.module.css"


export default function Home() {
    return (
    <div className={styles.mainContainer}>
        <h1 className={styles.h1}>Private Event Planner</h1>
        <span className={styles.description}>
            Private Event Planner is an application designed for organizing private events intuitively. It allows
            users to create and manage events in an easy way. Events can be accessed only by direct link, generated on event
            creation. This provides a secure way of sharing events with others. In order to create event user must provide
            basic information about event and his email address. Email address is used to send editing link to user.
            Application also allows to export events to ICS format and to add them on google calendar.
        </span>
    </div>
    );
}
