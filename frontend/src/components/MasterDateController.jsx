import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { FaCalendarAlt } from 'react-icons/fa';
import { useGlobalDate } from '../contexts/GlobalDateContext';

const MasterDateController = () => {
    const { workingDate, setWorkingDate, today } = useGlobalDate();
    const isBackdated = workingDate !== today;

    const handleChange = (e) => {
        const selectedDate = e.target.value;
        
        // DEBUG LOG: Open your Browser Console (F12)
        // If you don't see this when clicking a date, the event isn't firing.
        console.log("🛠️ [DATE PICKER] Change event triggered. New Date:", selectedDate);

        // GUARD CLAUSE: Only update if the date actually changed
        if (selectedDate !== workingDate) {
            setWorkingDate(selectedDate);
        }
    };

    return (
        <InputGroup size="sm" style={{ width: '200px' }}>
            <InputGroup.Text className={isBackdated ? "bg-warning" : "bg-primary text-white"}>
                <FaCalendarAlt />
            </InputGroup.Text>
            <Form.Control
                type="date"
                value={workingDate}
                max={today}
                onChange={handleChange} // Back to immediate change
                className={isBackdated ? "border-warning bg-warning-subtle" : ""}
                style={{ fontSize: '0.85rem' }}
            />
        </InputGroup>
    );
};

export default MasterDateController;