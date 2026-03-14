import dayjs from 'dayjs';

export function getBookingTypeLabel(type) {
    switch (type) {
        case '0':
            return 'Member';
        case '2':
            return 'Corporate Member';
        case 'guest-1':
            return 'Applied Member';
        case 'guest-2':
            return 'Affiliated Member';
        case 'guest-3':
            return 'VIP Guest';
        default:
            return 'Booking';
    }
}

export const JSONParse = (data) => {
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
};

export const numberToWords = (num) => {
    const units = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const thousands = ['', 'THOUSAND', 'MILLION', 'BILLION'];

    if (num === 0) return 'ZERO';
    let word = '';
    let i = 0;

    while (num > 0) {
        let chunk = num % 1000;
        if (chunk) {
            let chunkWord = '';
            if (chunk >= 100) {
                chunkWord += units[Math.floor(chunk / 100)] + ' HUNDRED ';
                chunk %= 100;
            }
            if (chunk >= 20) {
                chunkWord += tens[Math.floor(chunk / 10)] + ' ';
                chunk %= 10;
            }
            if (chunk >= 10) {
                chunkWord += teens[chunk - 10] + ' ';
            } else if (chunk > 0) {
                chunkWord += units[chunk] + ' ';
            }
            word = chunkWord + thousands[i] + (word ? ' ' : '') + word;
        }
        num = Math.floor(num / 1000);
        i++;
    }
    return word.trim();
};

export const generateInvoiceContent = (booking, type) => {
    // const data = getInvoiceData(booking);
    if (!booking) return '';

    switch (type) {
        case 'ROOM_BOOKING':
            return `<!doctype html>
<html>
    <head>
        <title>Booking Invoice</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 0px;
                max-width: 930px;
                <!-- margin: 0 auto; -->
            }
            .container {
                margin-top: 10px;

            }
            .paper {
                border-radius: 4px;
                position: relative;
                overflow: hidden;
            }
            .grid-container {
                display: flex;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid #f0f0f0;
                // background-color: #063455
            }
            .grid-item-left {
                flex: 0 0 33.33%;
                display: flex;
                align-items: center;
            }
            .grid-item-center {
                flex: 0 0 33.33%;
                text-align: center;
            }
            .grid-item-right {
                flex: 0 0 33.33%;
                text-align: end;
            }
            .logo {
                height: 60px;
            }
            .typography-h6 {
                font-size: 18px;
                font-weight: bold;
            }
            .typography-body3 {
                font-size: 12px;
                color: #555;
                line-height: 1.4;
            }
            .typography-body2 {
                font-size: 12px;
                color: #000;
                line-height: 0.6;
            }
            .typography-body2-bold {
                font-size: 13px;
                font-weight: bold;
            }
            .subtitle1 {
                font-size: 24px;
            font-weight: bold;
            display: flex;
            justify-content: center;
            text-align: center;
            width: 100%;
            color: #7f7f7f
            }
            .summary-container {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 24px;
            }
            .summary-box {
                width: 33.33%;
                padding-top: 8px;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 16px;
                border-bottom: 1px solid #eee;
            }
            .notes-container {
                display: flex;
                gap: 16px;
                margin-bottom: 24px;
            }
            .notes-item {
                flex: 0 0 50%;
            }
            .amount-in-words {
                font-size: 13px;
                font-weight: bold;
                margin-top: 4px;
                text-transform: uppercase;
            }
            .two-column {
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
            }
            .two-column > div {
                flex: 0 0 48%;
            }
        </style>
    </head>
    <body>
    <div class="subtitle1">BOOKING DETAILS</div>
        <div class="container">
            <div class="paper">
                <!-- Header -->
                <div class="grid-container">
                    <div class="grid-item-left">
                        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1c95d02f2c4a986d4f386920c76ff57c18c81985-YeMq5tNsLWF62HBaZY1Gz1HsT7RyLX.png" alt="Afohs Club Logo" class="logo" />
                    </div>
                    <div class="grid-item-center">
                        <div class="typography-h6" style="color: #063455">AFOHS CLUB</div>
                        <div class="typography-body3">
                            PAF Falcon complex, Gulberg III, Lahore, Pakistan Tel: +92-42-35925318-9
                        </div>
                    </div>
                    <div class="grid-item-right">
                        <div class="typography-h6" style="color: #333">
                        ${getBookingTypeLabel(booking.booking_type)}
                        </div>
                    </div>
                </div>

                <!-- Bill To Section -->
                <div style="margin-bottom: 10px;">
  <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
    <tbody>
     <!-- Row 1 -->
      <tr>
        <td style="border: 1px solid #000; padding: 10px;">
          <strong>Booking No:</strong>
          ${booking.booking_no ? booking.booking_no : 'N/A'}
        </td>

        <td style="border: 1px solid #000; padding: 10px;">
          <strong>Booking Date:</strong>
          ${booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('en-GB') : 'N/A'}
        </td>

        <td style="border: 1px solid #000; padding: 10px;">
          <strong>Booking Type:</strong>
          ${getBookingTypeLabel(booking.booking_type)}
        </td>
      </tr>
       <!-- Row 2 -->
      <tr>
        <td style="border: 1px solid #000; padding: 10px;">
          <strong>Check-in:</strong>
          ${booking.check_in_date ? dayjs(booking.check_in_date).format('DD-MM-YYYY') : 'N/A'}
        </td>

        <td style="border: 1px solid #000; padding: 10px;" colspan="2">
          <strong>Check-Out:</strong>
          ${booking.check_out_date ? dayjs(booking.check_out_date).format('DD-MM-YYYY') : 'N/A'}
        </td>
      </tr>
      <!-- Row 3 -->
      <tr>
        <td style="border: 1px solid #000; padding: 10px;">
          <strong>Name:</strong>
          ${booking.customer
                    ? booking.customer.name
                    : booking.member
                        ? booking.member.full_name
                        : (booking.corporateMember || booking.corporate_member)
                            ? (booking.corporateMember || booking.corporate_member).full_name
                            : 'N/A'}
        </td>

         <td style="border: 1px solid #000; padding: 10px;">
          <strong>Phone No:</strong>
          ${booking.customer
                    ? booking.customer.contact
                    : booking.member
                        ? booking.member.mobile_number_a
                        : (booking.corporateMember || booking.corporate_member)
                            ? (booking.corporateMember || booking.corporate_member).mobile_number_a
                            : 'N/A'}
        </td>

        <td style="border: 1px solid #000; padding: 10px;">
          <strong>Email:</strong>
          ${booking.customer
                    ? booking.customer.email
                    : booking.member
                        ? booking.member.personal_email
                        : (booking.corporateMember || booking.corporate_member)
                            ? (booking.corporateMember || booking.corporate_member).personal_email
                            : 'N/A'}
        </td>

      </tr>

      <tr>
        <td style="border: 1px solid #000; padding: 10px;">
          <strong>Family Member:</strong>
          ${booking.family_member ? booking.family_member.full_name + ' (' + booking.family_member.membership_no + ')' : ''}
        </td>

        <td style="border: 1px solid #000; padding: 10px;" colspan="2">
        <strong>Address:</strong>
        ${booking.customer
                    ? booking.customer.address
                    : booking.member
                        ? booking.member.current_address
                        : (booking.corporateMember || booking.corporate_member)
                            ? (booking.corporateMember || booking.corporate_member).current_address
                            : 'N/A'}
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 10px;">
          <strong>City:</strong>
          ${booking.member
                    ? booking.member.current_city
                    : (booking.corporateMember || booking.corporate_member)
                        ? (booking.corporateMember || booking.corporate_member).current_city
                        : 'N/A'}
        </td>

        <td style="border: 1px solid #000; padding: 10px;">
        <strong>Country:</strong>
        ${booking.member
                    ? booking.member.current_country
                    : (booking.corporateMember || booking.corporate_member)
                        ? (booking.corporateMember || booking.corporate_member).current_country
                        : 'N/A'}
        </td>
        <td style="border: 1px solid #000; padding: 10px;">
        <strong>CNIC / Passport No:</strong>
        ${booking.customer
                    ? booking.customer.cnic
                    : booking.member
                        ? booking.member.cnic_no
                        : (booking.corporateMember || booking.corporate_member)
                            ? (booking.corporateMember || booking.corporate_member).cnic_no
                            : 'N/A'}
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 10px;">
        <strong>Membership No:</strong>
        ${booking.customer
                    ? booking.customer.customer_no
                    : booking.member
                        ? booking.member.membership_no
                        : (booking.corporateMember || booking.corporate_member)
                            ? (booking.corporateMember || booking.corporate_member).membership_no
                            : 'N/A'}
        </td>

        <td style="border: 1px solid #000; padding: 10px;">
          <strong>Acc. Guest Name:</strong>
          ${booking.accompanied_guest || 'N/A'}
        </td>

        <td style="border: 1px solid #000; padding: 10px;">
        <strong>Relationship:</strong>
        ${booking.acc_relationship || 'N/A'}
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 10px;">
          <strong>Guest Name:</strong>
          ${booking.guest_first_name || ''} ${booking.guest_last_name || ''}
        </td>
        </td>
        <td style="border: 1px solid #000; padding: 10px;">
        <strong>Guest Category:</strong>
        ${booking.category?.name || 'N/A'}
        </td>
        <td style="border: 1px solid #000; padding: 10px;">
        <strong>CNIC:</strong>
        ${booking.guest_cnic || 'N/A'}
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 10px;">
          <strong>Guest Tel:</strong>
          ${booking.guest_mob || 'N/A'}
        </td>

        <td style="border: 1px solid #000; padding: 10px;">
        <strong>Booked By:</strong>
        ${booking.booked_by || 'N/A'}
        </td>
        <td style="border: 1px solid #000; padding: 10px;">
        <strong>Room No:</strong>
        ${booking.room?.name} (${booking.room?.room_type?.name || ''})
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 10px;">
          <strong>No. of Nights:</strong>
          ${booking.nights || 'N/A'}
        </td>

        <td style="border: 1px solid #000; padding: 10px;">
        <strong>Rates Per Night:</strong>
        ${Math.round(booking.per_day_charge || 0)}
        </td>
        <td style="border: 1px solid #000; padding: 10px;">
        <strong>Room Charges:</strong>
        ${Math.round(booking.room_charge || 0)}
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 10px;text-align: center;" colspan="3">
          <strong>Other Charges Details</strong>
        </td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 10px;"><strong>Breakfast:</strong> Free for upto 2 persons</td>
        <td style="border: 1px solid #000; padding: 10px;"><strong>Food & Beverages:</strong> As per usage</td>
        <td style="border: 1px solid #000; padding: 10px;"><strong>Mini Bar:</strong> As per usage</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 10px;"><strong>Outgoing Calls:</strong> As per usage</td>
        <td style="border: 1px solid #000; padding: 10px;"><strong>Dry Cleaning / Ironing:</strong> As per usage</td>
        <td style="border: 1px solid #000; padding: 10px;"><strong>Transport:</strong> As per usage</td>
      </tr>
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 10px;"><strong>Wifi:</strong> Free of cost</td>
      </tr>

      <!-- Discount Row (if applicable) -->
      ${booking.discount_value && parseFloat(booking.discount_value) > 0 ? `
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 10px;"><strong>Discount (${booking.discount_type || 'Fixed'}):</strong></td>
        <td style="border: 1px solid #000; padding: 10px;">Rs. ${Math.round(booking.discount_value)}</td>
      </tr>
      ` : ''}

      <!-- Row 12 New -->
      <tr>
        <td style="border: 1px solid #000; padding: 10px;">
          <strong>Total Payable Amount:</strong> ${Math.round(booking.grand_total || 0)}
        </td>
        <td style="border: 1px solid #000; padding: 10px;" colspan="2">
            <strong>Advance Amount:</strong>
            ${(() => {
                    let paid = parseFloat(booking.invoice?.paid_amount || 0);
                    if (booking.invoice?.status === 'refunded') {
                        const notes = booking.additional_notes || booking.notes;
                        const match = notes && notes.match(/Refund Processed: (\d+)/);
                        if (match) {
                            paid += parseInt(match[1]);
                        }
                    }
                    return Math.round(paid);
                })()}
        </td>
      </tr>

      <!-- Row 13 New -->
      <tr>
        <td colspan="3" style="border: 1px solid #000; padding: 10px;">
        <strong>Remaining Balance:</strong>
        ${(() => {
                    const total = parseFloat(booking.grand_total || 0);
                    const paid = parseFloat(booking.invoice?.paid_amount || 0);
                    return Math.round(total - paid);
                })()}
        </td>
      </tr>

    </tbody>
  </table>

  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px;">
    <tbody>
      <!-- Row 1 -->
      <tr>
        <td colspan="3" style="border: 1px solid #000; padding: 10px; font-weight: bold;">
        <strong>Comments / Special Requirements:</strong>
        </td>
        </tr>

        <!-- Row 2 -->
        <tr>
        <td style="border: 1px solid #000; padding: 10px; text-align:center;">
        <strong>Guest Signature</strong>
        </td>
        <td style="border: 1px solid #000; padding: 10px; text-align:center;">
        <strong>FDO Signature</strong>
        </td>
        </tr>

        <!-- Row 3 -->
        <tr>
        <td style="border: 1px solid #000; padding: 60px; text-align:center;">

        </td>
        <td style="border: 1px solid #000; padding: 60px; text-align:center;">

        </td>
        </tr>
        <tbody>
        </table>

        <div style="page-break-before: always; margin-top: 40px;"></div>

<div style="font-family: Inter; font-size: 12px; line-height: 1; max-width: 800px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 10px;">
        <strong style="font-size: 18px; font-weight: bold; color: #063455;">TERMS & CONDITIONS</strong>
    </div>

    <div>
        <strong>1.</strong> Any cancellation or amendments must be made before 4pm (Local Time) 1 day prior to the date of arrival. Otherwise a Cancellation fee/ No-Show equivalent to the room rate for the first night will be levied. Standard check in time is 1400 Hours and check-out time is 1200 Hours. Early check-in is subject to availability of the room.<br><br>
        <strong>2.</strong> In case of No Show – one night charged shall be deducted.<br><br>
        <strong>3.</strong> Guest Rooms will be booked on first come first serve basis. Due to any emergent operations/ emergency requirement, AFOHS Club management can cancel the booking. Honorable Member must be informed about the cancellation thorough a phone call/sms.<br><br>

        <strong>4.</strong> WIFI in rooms and lobby area is available for free of cost.<br><br>

        <strong>5.</strong> Guest Rooms will be charged as per the Category and eligibility of the occupant.<br><br>

        <strong>6.</strong> Credentials of guests shall be verified i-e relationship of accompanied guest/s.<br><br>

        <strong>7.</strong> No immoral activity will be allowed in the Guest Rooms.<br><br>

        <strong>8.</strong> No alcohol, gambling or any illegal activity will be allowed in the Guest Rooms. Strict actions will be taken against the violators.<br><br>

        <strong>9.</strong> No strange visitor is allowed in the room. All visitors must register themselves in the reception office before visiting the guest's in the rooms.<br><br>

        <strong>10.</strong> All rooms of AFOHS Club are non-smoking rooms and smoking inside the rooms is prohibited.<br><br>

        <strong>11.</strong> No fire arms, narcotics and or other illegal items are allowed in the room or in the club premises. All licensed / service weapons must be declared and handed over to the in-charge security of AFOHS Club.<br><br>

        <strong>12.</strong> If any suspicious activity is observed in the room or other areas involving the occupants, the AFOHS Club management reserves the right to ask the guest/s to leave the room and premises on immediate basis without prior notice.<br><br>

        <strong>13.</strong> Absolutely no pets or any other kind of animals are allowed in any part of the club premises.<br><br>

        <strong>14.</strong> Guest agrees to make sure that all of his visitors will abide by the AFOHS Club and Falcon Complex rules and regulations.<br><br>

        <strong>15.</strong> Guest/Guarantor assume full responsibility for any damaged caused to the room, facilities, crockery, cutlery, building or any other area / place / items by them, their children and guests and agrees to pay the costs involved without hesitation.<br><br>

        <strong>16.</strong> All foreigner guests are subject to interview and club management reserves the right to ask the guest to produce security clearance certificate and valid visa to stay in Pakistan if and when needed. And if security clearance or visa is not produced, the club management reserves the right to ask the guest/s to leave the room and club premises.<br><br>

        <strong>17.</strong> This is the responsibility of the guest to make sure that they do not leave their minor children unattended at all times during their presence in the club premises. The club management, Options International PVT Ltd and AHQ cannot be held accountable in any manner in case any unattended minor child/children gets hurt, injured or any serious mishap happens with the unattended children.<br><br>

        <strong>18.</strong> Towels, bed sheets, pillows, plants, pots and other furniture and fixture in the room must be left in the condition as it was handed over. Any broken or destroyed item will be charged separately.<br><br>

        <strong>19.</strong> Guest room supervisor will perform check out inspection and will prepare the final bill after the thorough inspection only.<br><br>

        <strong>20.</strong> Final bill will also include items used from mini bar, meals, services used during stay and missing/broken/ destroyed items.<br><br>

        <strong>21.</strong> Guest Rooms will be booked against advance payment only.<br><br>

        <strong>22.</strong> One extra mattress will be provided as per demand @ Rs. 500/- per night.<br><br>

        <strong>23.</strong> Maximum 2 adults and 2 kids under the age of 12 can stay in one room.<br><br>

        <strong>24.</strong> Complimentary breakfast is available for two persons per room. All extra number of breakfasts will be charged separately.<br><br>

        <strong>25.</strong> All other meals inside the room or in dining areas will be charged separately.<br><br>

        <strong>26.</strong> Check-in time will be from 1400 hrs onward and check out time will be 1200 hrs.<br><br>

        <strong>27.</strong> Early check out by guest's own decision doesn't make the guest eligible for any discount.<br><br>

        <strong>28.</strong> Final Bill must be paid and keys of the room/s must be returned to the guest room supervisor prior to check out.<br><br>

        <strong>29.</strong> Only cash or own credit cards will be accepted as method of payments. All payments through credit card will be charged by Adding 5% processing fees.<br><br>

        <strong>30.</strong> Use of iron in the room is strictly prohibited.
    </div>

    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ccc;">
    <strong style="font-size: 14px; color: #063455;">SAFETY OF VALUABLES</strong><br><br>
    Room Guests are responsible for the safe Guard of their valuables. The Room Cleaning will be accomplished only in the presence of the room occupant. In case the room is to be made / cleaned in the absence of the member / guest, the Guest Rooms Manager is to be informed about the valuables kept in the room.
</div><br><br>

    <div style="margin-top: 20px; display: flex; justify-content: space-between; font-size: 12px;">
        <div><strong>Guest Signature: ____________________</strong></div>
        <div><strong>FDO Signature: ___________________</strong></div>
    </div>
</div>
</div>

    </div>
        </div>
    </body>
</html>
`;
        case 'CHECK_IN':
        case 'CHECK_OUT':
        case 'CANCELLATION':
        default:
            return `<!doctype html>
      <html>
          <head>
              <title>Booking Invoice</title>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      padding: 20px;
                      max-width: 930px;
                      margin: 0 auto;
                  }
                  .container {
                      margin-top: 16px;

                  }
                  .paper {
                      border-radius: 4px;
                      position: relative;
                      overflow: hidden;
                  }
                  .grid-container {
                display: flex;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid #f0f0f0;
                // background-color: #063455
            }
            .grid-item-left {
                flex: 0 0 33.33%;
                display: flex;
                align-items: center;
            }
            .grid-item-center {
                flex: 0 0 33.33%;
                text-align: center;
            }
            .grid-item-right {
                flex: 0 0 33.33%;
                text-align: end;
            }
                  .logo {
                      height: 60px;
                  }
                  .typography-h6 {
                      font-size: 18px;
                      font-weight: bold;
                  }
                  .typography-body3 {
                      font-size: 12px;
                      color: #555;
                      line-height: 1.4;
                  }
                  .typography-body2 {
                      font-size: 12px;
                      color: #000;
                      line-height: 0.6;
                  }
                  .typography-body2-bold {
                      font-size: 13px;
                      font-weight: bold;
                  }
                  .subtitle1 {
                      font-size: 14px;
                      font-weight: bold;
                      margin-bottom: 12px;
                  }
                  .summary-container {
                      display: flex;
                      justify-content: flex-end;
                      margin-bottom: 24px;
                  }
                  .summary-box {
                      width: 33.33%;
                      padding-top: 8px;
                  }
                  .summary-row {
                      display: flex;
                      justify-content: space-between;
                      margin-bottom: 16px;
                      border-bottom: 1px solid #eee;
                  }
                  .notes-container {
                      display: flex;
                      gap: 16px;
                      margin-bottom: 24px;
                  }
                  .notes-item {
                      flex: 0 0 50%;
                  }
                  .amount-in-words {
                      font-size: 13px;
                      font-weight: bold;
                      margin-top: 4px;
                      text-transform: uppercase;
                  }
                  .two-column {
                      display: flex;
                      flex-wrap: wrap;
                      gap: 16px;
                  }
                  .two-column > div {
                      flex: 0 0 48%;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="paper">
                      <!-- Header -->
                      <div class="grid-container">
                          <div class="grid-item-left">
                              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1c95d02f2c4a986d4f386920c76ff57c18c81985-YeMq5tNsLWF62HBaZY1Gz1HsT7RyLX.png" alt="Afohs Club Logo" class="logo" />
                          </div>
                          <div class="grid-item-center">
                              <div class="typography-h6" style="color: #063455">Afohs Club</div>
                              <div class="typography-body3">
                                  PAF Falcon complex, Gulberg III, Lahore, Pakistan
                              </div>
                          </div>
                          <div class="grid-item-right">
                              <div style="color: #333; margin-top: 10px; font-weight:600;">
                            <!-- ${getBookingTypeLabel(booking.booking_type)} -->
                            GUEST ROOMS INVOICE
                              </div>
                              <div style="
                                  margin-top: 4px;
                                  font-size: 14px;
                                  font-weight: bold;
                                  display: ${booking.invoice?.status === 'cancelled' ? 'none' : 'block'};
                                  color: ${booking.invoice?.status === 'paid' ? '#155724' :
                    booking.invoice?.status === 'refunded' ? '#004085' :
                        booking.invoice?.status === 'unpaid' ? '#721c24' :
                            '#333'
                };
                                  background-color: ${booking.invoice?.status === 'paid' ? '#d4edda' :
                    booking.invoice?.status === 'refunded' ? '#cce5ff' :
                        booking.invoice?.status === 'unpaid' ? '#f8d7da' :
                            '#e2e3e5'
                };
                                  text-transform: uppercase;
                                  border: 1px solid ${booking.invoice?.status === 'paid' ? '#c3e6cb' :
                    booking.invoice?.status === 'refunded' ? '#b8daff' :
                        booking.invoice?.status === 'unpaid' ? '#f5c6cb' :
                            '#d6d8db'
                };
                                  padding: 2px 8px;
                                  display: inline-block;
                                  border-radius: 4px;
                              ">
                                  ${(booking.invoice?.status || 'Unpaid').replace(/_/g, ' ')}
                                  ${booking.invoice?.status === 'refunded' ? (() => {
                    const notes = booking.additional_notes || booking.notes;
                    const match = notes && notes.match(/Refund Processed: (\d+)/);
                    return match ? ` (Rs ${match[1]})` : '';
                })() : ''}
                              </div>
                          </div>
                      </div>

                      <!-- Bill To Section -->
                      <!-- <div style="margin-bottom: 20px">
                          <div class="subtitle1">Bill To - #${booking.booking_no || 'N/A'}</div>
                          <div class="two-column">
                              <div class="typography-body2"><span style="font-weight: bold">Guest Name: </span>${booking.customer ? booking.customer.name : booking.member ? booking.member.full_name : (booking.corporateMember || booking.corporate_member) ? (booking.corporateMember || booking.corporate_member).full_name : ''}</div>
                              <div class="typography-body2">
                                <span style="font-weight: bold">Membership ID: </span>
                                ${booking.customer ? booking.customer.customer_no : booking.member ? booking.member.membership_no : (booking.corporateMember || booking.corporate_member) ? (booking.corporateMember || booking.corporate_member).membership_no : 'N/A'}
                              </div>
                              <div class="typography-body2">
                                <span style="font-weight: bold">Phone Number: </span>
                                ${booking.customer ? booking.customer.contact : booking.member ? booking.member.mobile_number_a : (booking.corporateMember || booking.corporate_member) ? (booking.corporateMember || booking.corporate_member).mobile_number_a : 'N/A'}
                              </div>
                              <div class="typography-body2">
                                <span style="font-weight: bold">Email: </span>
                                ${booking.customer ? booking.customer.email : booking.member ? booking.member.personal_email : (booking.corporateMember || booking.corporate_member) ? (booking.corporateMember || booking.corporate_member).personal_email : 'N/A'}
                              </div>
                          </div>
                      </div> -->
                      <div style="margin-bottom: 20px; display: flex; gap: 50px;">

    <!-- LEFT COLUMN : BILL TO -->
    <div style="flex: 1;">
        <div class="subtitle1" style="font-size:14px; font-weight:600;">Bill To</div>

        <div class="typography-body2" style="margin-bottom: 6px;">
            <span style="font-weight: bold">Booking #: </span>
            ${booking.booking_no || 'N/A'}
        </div>
        <div class="typography-body2" style="margin-bottom: 6px;">
            <span style="font-weight: bold">Booking Date: </span>
            ${booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('en-GB') : 'N/A'}
        </div>
        <div class="typography-body2" style="margin-bottom: 6px;">
            <span style="font-weight: bold">Name: </span>
            ${booking.customer
                    ? booking.customer.name
                    : booking.member
                        ? booking.member.full_name
                        : (booking.corporateMember || booking.corporate_member)
                            ? (booking.corporateMember || booking.corporate_member).full_name
                            : ''}
        </div>

        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">Booking Type: </span>${getBookingTypeLabel(booking.booking_type)}</div>
         <div class="typography-body2" style="margin-bottom: 6px;">
            <span style="font-weight: bold">Membership #: </span>
            ${booking.customer
                    ? booking.customer.customer_no
                    : booking.member
                        ? booking.member.membership_no
                        : (booking.corporateMember || booking.corporate_member)
                            ? (booking.corporateMember || booking.corporate_member).membership_no
                            : 'N/A'}
        </div>
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">CNIC / Passport: </span>${booking.customer
                    ? booking.customer.cnic
                    : booking.member
                        ? booking.member.cnic_no
                        : (booking.corporateMember || booking.corporate_member)
                            ? (booking.corporateMember || booking.corporate_member).cnic_no
                            : 'N/A'}</div>
        <div class="typography-body2" style="margin-bottom: 6px;">
            <span style="font-weight: bold">Contact #: </span>
            ${booking.customer
                    ? booking.customer.contact
                    : booking.member
                        ? booking.member.mobile_number_a
                        : (booking.corporateMember || booking.corporate_member)
                            ? (booking.corporateMember || booking.corporate_member).mobile_number_a
                            : 'N/A'}
        </div>
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">Email: </span><a style="color: #000; text-decoration: none;" href="mailto:${booking.customer
                    ? booking.customer.email
                    : booking.member
                        ? booking.member.personal_email
                        : booking.corporate_member
                            ? booking.corporate_member.personal_email
                            : 'N/A'}">${booking.customer
                                ? booking.customer.email
                                : booking.member
                                    ? booking.member.personal_email
                                    : booking.corporate_member
                                        ? booking.corporate_member.personal_email
                                        : 'N/A'}</a></div>
        <div class="typography-body2" style="margin-bottom: 6px; line-height: 1;"><span style="font-weight: bold">Address: </span>${booking.customer
                    ? booking.customer.address
                    : booking.member
                        ? booking.member.current_address
                        : booking.corporate_member
                            ? booking.corporate_member.current_address
                            : 'N/A'}</div>
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">Family Member: </span>${booking.family_member ? booking.family_member.full_name + ' (' + booking.family_member.membership_no + ')' : ''}</div>
    </div>

    <!-- RIGHT COLUMN : OCCUPIED BY -->
    <div style="flex: 1;">
        <div class="subtitle1">Occupied By</div>
                <!-- Removed Beds and Baths -->
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">Name: </span>${booking.guest_first_name || ''} ${booking.guest_last_name || ''}</div>
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">Guest Category: </span>${booking.category?.name}</div>
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">CNIC / Passport: </span>${booking.guest_cnic || 'N/A'}</div>
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">Contact #: </span>${booking.guest_mob || 'N/A'}</div>
        <div class="typography-body2" style="margin-bottom: 6px;">
            <span style="font-weight: bold">Email: </span>
            <a style="color: #000; text-decoration: none;" href="mailto:${booking.guest_email || 'N/A'}">${booking.guest_email || 'N/A'}</a>
        </div>
        <div class="typography-body2" style="margin-bottom: 6px;line-height: 1;"><span style="font-weight: bold">Address: </span>${booking.guest_address || 'N/A'}</div>
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">City: </span>${booking.guest_city || 'N/A'}</div>
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">Country: </span>${booking.guest_country || 'N/A'}</div>
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">Booked By: </span>${booking.booked_by || 'N/A'}</div>
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">Accompanied Guest: </span>${booking.accompanied_guest ? `${booking.accompanied_guest}` : 'N/A'}</div>
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">Relationship: </span>${booking.acc_relationship || 'N/A'}</div>

        ${['cancelled', 'no_show', 'refunded'].includes(booking.status) ? `
        <div class="typography-body2" style="margin-bottom: 6px;"><span style="font-weight: bold">Cancellation Reason: </span>${booking.cancellation_reason || 'N/A'}</div>
        ` : ''}
    </div>

</div>

<!-- Summary and Notes sections remain unchanged -->
<div style="margin-top: 24px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
            <tr style="border-bottom: 1px solid #ddd;">
                <th style="text-align: left; padding: 8px 4px;">ROOM</th>
                <th style="text-align: left; padding: 8px 4px;">CHARGES</th>
                <th style="text-align: left; padding: 8px 4px;">CHECK-IN DATE</th>
                <th style="text-align: left; padding: 8px 4px;">CHECK-OUT DATE</th>
                <th style="text-align: center; padding: 8px 4px;">NIGHTS</th>
                <th style="text-align: right; padding: 8px 4px;">TOTAL</th>
            </tr>
        </thead>

        <tbody>
            <tr>
                <td style="padding: 8px 4px;">
                    ${booking.room?.name || ''} (${booking.room?.room_type?.name || 'Room'})
                </td>

                <td style="padding: 8px 4px;">
                    ${Math.round(booking.per_day_charge || 0)}
                </td>

                <td style="padding: 8px 4px;">
                    ${booking.check_in_date
                    ? `${dayjs(booking.check_in_date).format('DD/MM/YYYY')} (${booking.check_in_time ? dayjs('2000-01-01 ' + booking.check_in_time).format('hh:mm A') : 'N/A'})`
                    : 'N/A'}
                </td>

                <td style="padding: 8px 4px;">
                    ${booking.check_out_date
                    ? `${dayjs(booking.check_out_date).format('DD/MM/YYYY')} (${booking.check_out_time ? dayjs('2000-01-01 ' + booking.check_out_time).format('hh:mm A') : 'N/A'})`
                    : 'N/A'}
                </td>

                <td style="padding: 8px 4px; text-align: center;">
                    ${booking.nights || booking.no_of_nights || 1}
                </td>

                <td style="padding: 8px 4px; text-align: right;">
                    ${Math.round(booking.room_charge || 0)}
                </td>
            </tr>
        </tbody>
    </table>
</div>

<div style="margin-top: 40px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
            <tr style="border-bottom: 1px solid #ddd;">
                <th style="text-align: left; padding: 8px 4px;">FOOD BILL CHARGES</th>
            </tr>
        </thead>

        <tbody>
            <tr>
                <td style="padding: 8px 4px;">
                    ${(() => {
                    const orders = booking.orders || [];
                    const total = orders.reduce((sum, order) => sum + parseFloat(order.total_price || order.total || order.grand_total || 0), 0);
                    return Math.round(total || 0);
                })()}
                </td>
            </tr>
        </tbody>
    </table>
</div>

<div style="margin-top: 40px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
            <tr style="border-bottom: 1px solid #ddd;">
                <th style="text-align: left; padding: 8px 4px;">OTHER CHARGES</th>
                <th style="text-align: right; padding: 8px 4px;">AMOUNT</th>
            </tr>
        </thead>

        <tbody>
            ${(() => {
                    const otherCharges = booking.other_charges || booking.otherCharges || [];
                    const rows = Array.isArray(otherCharges) ? otherCharges.filter((c) => c && (c.type || c.details || c.amount)) : [];

                    if (!rows.length) {
                        return `
                            <tr>
                                <td style="padding: 8px 4px;" colspan="2">-</td>
                            </tr>
                        `;
                    }

                    return rows
                        .map((charge) => {
                            const title = [charge.type, charge.details].filter(Boolean).join(' - ');
                            const isComplementary = charge.is_complementary === true || charge.is_complementary === 1;
                            const amount = isComplementary ? 0 : parseFloat(charge.amount || 0);
                            return `
                                <tr>
                                    <td style="padding: 6px 4px;">${title || 'Charge'}${isComplementary ? ' (Complimentary)' : ''}</td>
                                    <td style="padding: 6px 4px; text-align: right;">${Math.round(amount || 0)}</td>
                                </tr>
                            `;
                        })
                        .join('');
                })()}
            <tr style="border-top: 1px solid #ddd;">
                <td style="padding: 8px 4px; font-weight: bold;">Other Charges Total</td>
                <td style="padding: 8px 4px; text-align: right; font-weight: bold;">${Math.round(booking.total_other_charges || 0)}</td>
            </tr>
            <tr style="border-top: 1px solid #ddd;">
                <td style="padding: 8px 4px; font-weight: bold;">Mini Bar</td>
                <td style="padding: 8px 4px; text-align: right; font-weight: bold;">${Math.round(booking.total_mini_bar || 0)}</td>
            </tr>
        </tbody>
    </table>
</div>
<div style="margin-top: 32px; display: flex; gap: 24px; font-size: 12px;">

    <!-- LEFT COLUMN -->
    <div style="flex: 1;">
        <div style="font-weight: bold; margin-bottom: 6px;">
            COMMENT / SPECIAL REQUIREMENTS:
        </div>
    </div>

    <!-- RIGHT COLUMN -->
    <div style="width: 300px;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; font-weight: bold; border-top: 1px solid #ddd;">TOTAL PAYABLE AMOUNT</td>
                <td style="padding: 8px 0; border-top: 1px solid #ddd;">
                    ${Math.round((parseFloat(booking.grand_total || 0) + (booking.orders || []).reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0)))}
                </td>
            </tr>

            <tr>
                <td style="padding: 8px 0; font-weight: bold; border-top: 1px solid #ddd;">ADVANCE</td>
                <td style="padding: 8px 0; border-top: 1px solid #ddd;">
                    ${(() => {
                    const invoiceAdvance = parseFloat(booking.invoice?.advance_payment || 0);
                    const invoicePaid = parseFloat(booking.invoice?.paid_amount || 0);
                    const advance = invoiceAdvance > 0 ? invoiceAdvance : invoicePaid;
                    return Math.round(advance || 0);
                })()}
                </td>
            </tr>

            <tr>
                <td style="padding: 8px 0; font-weight: bold; border-top: 1px solid #ddd;">TOTAL PAID AMOUNT</td>
                <td style="padding: 8px 0; border-top: 1px solid #ddd;">
                    ${(() => {
                    const invoiceAdvance = parseFloat(booking.invoice?.advance_payment || 0);
                    const paidAmountRaw = parseFloat(booking.invoice?.paid_amount || 0);
                    const advance = invoiceAdvance > 0 ? invoiceAdvance : 0;
                    const paidAmount = advance > 0 && paidAmountRaw >= advance ? (paidAmountRaw - advance) : paidAmountRaw;
                    const paidOrders = (booking.orders || [])
                        .filter(o => o.payment_status === 'paid')
                        .reduce((sum, order) => sum + parseFloat(order.total_price || order.total || order.grand_total || 0), 0);
                    return Math.round(paidAmount + paidOrders);
                })()}
                </td>
            </tr>

            <tr>
                <td style="padding: 8px 0; font-weight: bold; border-top: 1px solid #ddd;">REMAINING BALANCE</td>
                <td style="padding: 8px 0; border-top: 1px solid #ddd;">
                    ${(() => {
                    const total = parseFloat(booking.grand_total || 0);
                    const orders = (booking.orders || []).reduce((sum, order) => sum + parseFloat(order.total_price || order.total || order.grand_total || 0), 0);
                    const invoiceAdvance = parseFloat(booking.invoice?.advance_payment || 0);
                    const paidAmountRaw = parseFloat(booking.invoice?.paid_amount || 0);
                    const advance = invoiceAdvance > 0 ? invoiceAdvance : 0;
                    const paidAmount = advance > 0 && paidAmountRaw >= advance ? (paidAmountRaw - advance) : paidAmountRaw;
                    const paidOrders = (booking.orders || [])
                        .filter(o => o.payment_status === 'paid')
                        .reduce((sum, order) => sum + parseFloat(order.total_price || order.total || order.grand_total || 0), 0);
                    const remaining = Math.max(0, (total + orders) - (advance + paidAmount + paidOrders));
                    return ['cancelled', 'refunded'].includes(booking.status) ? 0 : Math.round(remaining);
                })()}
                </td>
            </tr>
        </table>
    </div>
</div>
<div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div style="font-size: 12px;display: flex;gap:4px;">
                <div>GUEST ROOMS MANAGER SIGNATURE:</div>
                <div style="margin-top: 0px;">____________________</div>
            </div>

            <div style="font-size: 12px;display: flex;gap:4px;">
                <div>GUEST SIGNATURE:</div>
                <div style="margin-top: 0px;">____________________</div>
            </div>
        </div>

<!-- FOOTER -->
<div style="margin-top: 32px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 12px;">
    <div style="margin-bottom: 12px;">
        Thank you for your stay at AFOHS Club.
    </div>

    <div style="display: flex; justify-content: space-between;">
        <div><strong>Phone:</strong> +92 42 35925318 - 19</div>
        <div><strong>Email:</strong> guestrooms@afohsclub.pk</div>
        <div><strong>Website:</strong> www.afohsclub.pk</div>
    </div>
</div>
</div>
          </body>
      </html>
      `;
    }
};
