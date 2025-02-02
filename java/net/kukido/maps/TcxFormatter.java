package net.kukido.maps;

import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.text.MessageFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Created by craser on 11/6/15.
 */
public class TcxFormatter
{
    static private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ssZ", Locale.US);

    /**
     * Garmin's TCX format uses a non-standard date/time format.
     * Example: 2015-10-25T21:53:02+00:00
     * Note the T in the middle (which SimpleDateFormat chokes on) and the colon in the time zone indicator
     * (which is nonstandard and can't be reliably
     * @param date
     * @return
     */
    public String formatDate(Date date) {
        String d = dateFormat.format(date);
        StringBuilder b = new StringBuilder(d);
        d = d.replace(' ', 'T'); // Replace middle space with T, since SimpleDateFormat freaks about the T.
        d = d.substring(0, d.length() - 2) + ":" + d.substring(d.length() - 2); // Insert the colon.
        return d;
    }

    public void format(List<GpsTrack> tracks, OutputStream o) throws IOException
    {
        PrintWriter out = null;
        try {
            out = new PrintWriter(o);
            formatAll(tracks, out);
            out.flush();

        }
        catch (Exception e) {
            e.printStackTrace(System.out);
            try { out.close(); } catch (Exception ignored) {}
        }

    }

    private void formatAll(List<GpsTrack> tracks, PrintWriter out) throws IOException
    {
        printHeader(out);
        printGpx(tracks, out);
    }

    private void printHeader(PrintWriter out)
    {
        String header = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
        out.println(header);
    }

    private void printGpx(List<GpsTrack> tracks, PrintWriter out)
    {
        String openTag = "<TrainingCenterDatabase"
            + " xsi:schemaLocation=\"http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd\""
            + " xmlns:ns5=\"http://www.garmin.com/xmlschemas/ActivityGoals/v1\""
            + " xmlns:ns3=\"http://www.garmin.com/xmlschemas/ActivityExtension/v2\""
            + " xmlns:ns2=\"http://www.garmin.com/xmlschemas/UserProfile/v2\""
            + " xmlns=\"http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2\""
            + " xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">";

        String initialFillerTags = "<Folders/>";

        String closeTag = "</TrainingCenterDatabase>";

        out.println(openTag);
        out.println(initialFillerTags);
        out.println("<Courses>");
        for (GpsTrack track : tracks) {
            printTrack(track, out);
        }
        out.println("</Courses>");
        out.println(closeTag);
    }

    private void printTrack(GpsTrack track, PrintWriter out)
    {
        out.println("<Course>");
        out.println(formatName(track));
        String locFormat = "<Trackpoint>"
                + "<Time>{0}</Time>"
                + "<Position>"
                + "<LatitudeDegrees>{1}</LatitudeDegrees>"
                + "<LongitudeDegrees>{2}</LongitudeDegrees>"
                + "</Position>"
                + "</Trackpoint>";
        for (GpsLocation loc : track) {
            String timestamp = formatDate(loc.getTimestamp());
            String logString = MessageFormat.format(locFormat,
                    timestamp,
                    loc.getLatitude(),
                    loc.getLongitude());
            out.println(logString);
        }
        out.println("</Course>");
    }

    private String formatName(GpsTrack track) {
        String name = track.getName();
        return "<Name>" + (name != null ? name : "") + "</Name>";
    }

}
