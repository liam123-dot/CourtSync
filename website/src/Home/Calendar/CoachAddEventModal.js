import React, {useEffect, useState} from "react";

import {ModalOverlay, ModalContent} from "./ModalStyles"

export default function CoachAddEventModal ({ isOpen, onClose }) {

    if (!isOpen) return null;

    return (
        <ModalOverlay onClick={onClose}>

            <ModalContent onClick={(e) => e.stopPropagation()}>


            </ModalContent>

        </ModalOverlay>
    )

}