package net.kukido.maps;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class ActivityID {
    private static final SimpleDateFormat dateFormat;
    private Date timestamp;

    public ActivityID(GpsTrack track) {
        this(track.getStartTime());
    }

    public ActivityID(Date timestamp) {
        this.timestamp = null;
        this.timestamp = timestamp;
    }

    public ActivityID(String timestamp) throws IllegalArgumentException {
        this.timestamp = null;

        try {
            this.timestamp = this.parseDateString(timestamp);
        } catch (ParseException var3) {
            throw new IllegalArgumentException("Not parseable as a date: \"" + timestamp + "\"");
        }
    }

    public Date getTimestamp() {
        return this.timestamp;
    }

    public String toString() {
        return this.formatDateString(this.timestamp);
    }

    public boolean equals(ActivityID id) {
        return id.timestamp.equals(this.timestamp);
    }

    private String formatDateString(Date date) {
        dateFormat.setTimeZone(TimeZone.getTimeZone("Z"));
        String d = dateFormat.format(date);
        d = d.replace(' ', 'T');
        d = d.replace("+0000", "Z");
        return d;
    }

    private Date parseDateString(String dateString) throws ParseException {
        if(dateString.charAt(10) == 84) {
            char[] timestamp = dateString.toCharArray();
            timestamp[10] = 32;
            dateString = new String(timestamp);
        }

        if(dateString.endsWith("Z")) {
            dateString = dateString.substring(0, dateString.lastIndexOf(90));
            dateString = dateString + "GMT";
        }

        Date timestamp1 = dateFormat.parse(dateString);
        return timestamp1;
    }

    static {
        dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ssZ", Locale.UK);
    }
}
