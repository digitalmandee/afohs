import React from 'react';

const Table2 = ({ fillColor }) => {
    return (
        <svg width="100" height="138" viewBox="0 0 100 138" fill={fillColor ? fillColor : 'none'} xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5C12 2.79086 13.7909 1 16 1H84C86.2091 1 88 2.79086 88 5V9C88 11.2091 86.2091 13 84 13H16C13.7909 13 12 11.2091 12 9V5Z" fill={fillColor ? fillColor : 'white'} stroke="#E3E3E3" />
            <path d="M4 19.5H96C97.933 19.5 99.5 21.067 99.5 23V115C99.5 116.933 97.933 118.5 96 118.5H4C2.067 118.5 0.5 116.933 0.5 115V23C0.500001 21.067 2.067 19.5 4 19.5Z" fill={fillColor ? fillColor : 'white'} />
            <path d="M4 19.5H96C97.933 19.5 99.5 21.067 99.5 23V115C99.5 116.933 97.933 118.5 96 118.5H4C2.067 118.5 0.5 116.933 0.5 115V23C0.500001 21.067 2.067 19.5 4 19.5Z" stroke="#E3E3E3" />
            <path d="M12 129C12 126.791 13.7909 125 16 125H84C86.2091 125 88 126.791 88 129V133C88 135.209 86.2091 137 84 137H16C13.7909 137 12 135.209 12 133V129Z" fill={fillColor ? fillColor : 'white'} stroke="#E3E3E3" />
        </svg>
    );
};

export default Table2;
