import Lead from "../models/Lead.js";
import FirebaseToken from "../models/FirebaseToken.js";
import { sendPushNotification } from "./firebaseAdmin.js";

export const runReminderForAllLeads = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const leads = await Lead.find({
    meetingDate: {
      $gte: today,
      $lt: new Date(dayAfter.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  const tokens = await FirebaseToken.find();

  for (const lead of leads) {
    const meetingDate = new Date(lead.meetingDate);
    let message = "";

    if (isSameDay(meetingDate, dayAfter)) {
      message = `📅 Meeting with ${lead.name} in 2 days.`;
    } else if (isSameDay(meetingDate, tomorrow)) {
      message = `📆 Meeting with ${lead.name} tomorrow.`;
    } else if (isSameDay(meetingDate, today)) {
      message = `📍 Meeting with ${lead.name} today.`;
    }

    if (message) {
      for (const { token } of tokens) {
        try {
          await sendPushNotification(token, {
            title: "CRM Reminder",
            body: message,
            data: { leadId: lead._id.toString(), name: lead.name },
          });
        } catch (err) {
        }
      }
    }
  }
};
