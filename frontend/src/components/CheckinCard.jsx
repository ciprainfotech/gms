import React from 'react';
import { Badge } from 'react-bootstrap'; // Or use custom badge component
import Button from 'react-bootstrap/Button';
import { FaUser, FaClock, FaTools, FaCheckCircle } from 'react-icons/fa';

const CheckinCard = ({ vehicle, onStartRepair, onCompleteCheckout }) => {
    // Destructure for easier access
    const {
        id, customer, carNumber, vehicleModel, status, checkIn
    } = vehicle;

    return (
        // Add data-status for CSS accent border
        <div className="checkin-card shadow-sm" data-status={status}>
            <div className="card-vehicle-info">
                <span className="card-vehicle-number">{carNumber}</span>
                <span className="card-vehicle-model">{vehicleModel}</span>
            </div>

            <div className="card-customer-info">
                <FaUser /> <strong>{customer}</strong>
            </div>

            <div className="card-checkin-time">
                <FaClock /> <span>Checked In: {checkIn}</span>
            </div>

            {/* Actions only shown for Waiting or In Progress */}
            {(status === "Waiting" || status === "In Progress") && (
                <div className="card-actions">
                    {status === "Waiting" && (
                        <Button
                            variant="outline-warning" // Use custom class for specific styling
                            size="sm"
                            className="btn-start" // Custom class from CSS
                            onClick={() => onStartRepair(vehicle)}
                            title="Start Repair"
                        >
                            <FaTools /> Start Repair
                        </Button>
                    )}
                    {status === "In Progress" && (
                        <Button
                            variant="outline-success" // Use custom class for specific styling
                            size="sm"
                            className="btn-complete" // Custom class from CSS
                            onClick={() => onCompleteCheckout(vehicle)}
                            title="Mark as Completed"
                        >
                            <FaCheckCircle /> Complete
                        </Button>
                    )}
                </div>
            )}

            {/* Optionally display something for 'Completed' status */}
             {status === "Completed" && (
                <div className="text-end text-success fst-italic mt-2" style={{fontSize: '0.85rem'}}>
                    Ready for Billing/Pickup
                </div>
            )}
        </div>
    );
};

export default CheckinCard;