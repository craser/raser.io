package net.kukido.maps;

import org.xml.sax.*;
import org.xml.sax.helpers.DefaultHandler;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Stack;

/**
 * @author  craser
 */
public class TcxParser extends DefaultHandler
{
    static private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ssZ");

    private GpsTrack track;
    private GpsLocation trackPoint;
    private Stack<String> state;
    private StringBuffer chars;
    private List<GpsTrack> tracks;

    /** Creates a new instance of GpxHandler */
    public TcxParser() {
        state = new Stack<String>();
        chars = new StringBuffer();
        tracks = new ArrayList<GpsTrack>();
    }

    public List<GpsTrack> parse(byte[] bytes)
            throws SAXException, IOException
    {
        InputStream in = null;
        try
        {
            in = new ByteArrayInputStream(bytes);
            return parse(in);
        }
        finally
        {
            try { in.close(); } catch (Exception ignored) {}
        }
    }

    public List<GpsTrack> parse(InputStream in)
            throws SAXException, IOException
    {
        //XMLReader reader = XMLReaderFactory.createXMLReader();
        // FIXME: This should be soft-coded using a property value
        // to set the class name of the appropriate factory, etc.
        XMLReader reader = new org.apache.xerces.parsers.SAXParser();
        reader.setContentHandler(this);
        reader.parse(new InputSource(in));

        return tracks;
    }

    public void startPrefixMapping(String prefix, String uri)
    {
        //System.out.println("Mapping prefix: " + prefix + " => " + uri);
    }

    public void error(SAXParseException e)
    {
        System.err.println("'Recoverable' error parsing TCX document: " + e.getMessage());
        e.printStackTrace(System.err);
    }

    public void fatalError(SAXParseException e)
    {
        System.err.println("Fatal error parsing TCX document: " + e.getMessage());
        e.printStackTrace(System.err);
    }

    public void warning(SAXParseException e)
    {
        System.err.println("Warning while parsing TCX document: " + e.getMessage());
        e.printStackTrace(System.err);
    }

    public void startDocument() throws SAXException
    {
        //System.out.println("GpxParser: Starting Document");
    }

    public void startElement(String namespaceUrl, String locale, String name, Attributes atts) throws SAXException
    {
        state.push(name);
        if ("Activity".equals(name)) { // Source XML will nest Track elements inside Laps, but it's all in Activity and we don't want Lap info.
            track = new GpsTrack();
        }
        else if ("Trackpoint".equals(name)) {
            trackPoint = new GpsLocation();
        }
    }

    public void endElement(String namespaceURI, String localName, String name)
            throws SAXException
    {
        String currentState = (String)state.pop();

        if (state.contains("Author")) { // Just ignore the "Author" section.
            return;
        }

        if (!currentState.equals(name)) {
            throw new IllegalStateException("ERG!  Expected end of \"" + state.peek() + "\","
                    + " found \"" + name + "\"");
        }

        String val = chars.toString().trim();
        chars = new StringBuffer();

        if ("Trackpoint".equals(currentState)) {
            // TCX files occasionally have "Trackpoint" elements with no nested Lat/Lon.
            if (trackPoint.getLatitude() != 0f && trackPoint.getLongitude() != 0f) {
                trackPoint.setGrade(calculateGrade(track, trackPoint));
                trackPoint.setDistance(calculateDistance(track, trackPoint));
                trackPoint.setRouteTime(calculateRouteTime(track, trackPoint));
                track.add(trackPoint);
            }
            trackPoint = null; // Fail Fast
        }
        else if ("LatitudeDegrees".equals(currentState)) {
            trackPoint.setLatitude(Float.parseFloat(val));
        }
        else if ("LongitudeDegrees".equals(currentState)) {
            trackPoint.setLongitude(Float.parseFloat(val));
        }
        else if ("AltitudeMeters".equals(currentState)) {
            float elevation = Float.parseFloat(val);
            if (trackPoint != null) trackPoint.setElevation(elevation);
        }
        else if ("Time".equals(currentState)) {
            try {
                Date timestamp = parseDateString(val);
                if (trackPoint != null) trackPoint.setTimestamp(timestamp);
            }
            catch (ParseException e) {
                throw new SAXException("Unable to parse timestamp: \"" + val + "\"");
            }
        }
        else if ("Value".equals(currentState) && "HeartRateBpm".equals(state.peek())) {
            float hr = Float.parseFloat(val);
            if (trackPoint != null) trackPoint.setHeartRate(hr);
        }
        else if ("Id".equals(currentState)) {
            try {
                if ("Activity".equals(state.peek()) && (track != null)) {
                    track.setName(val);
                }
            }
            catch (Exception e) {
                System.out.println("Caught problem adding name:");
                e.printStackTrace(System.out);
            }
        }
        else if ("Activity".equals(currentState)) {
            tracks.add(track);
            track = null;
        }
    }

    private Date parseDateString(String dateString)
            throws ParseException
    {
        //System.out.println("GPX Time   : " + dateString);
        if (dateString.charAt(10) == 'T') {
            char[] chars = dateString.toCharArray();
            chars[10] = ' ';
            dateString = new String(chars);
        }
        if (dateString.endsWith("Z")) {
            dateString = dateString.substring(0, dateString.lastIndexOf('Z'));
            dateString += "GMT";
        }
        Date timestamp = dateFormat.parse(dateString);
        //System.out.println("Parsed Date: " + dateFormat.format(timestamp));

        return timestamp;
    }

    /**
     * Calculates the distance (in meters) along the track to the given point.
     * @param track
     * @param trackPoint
     */
    private double calculateDistance(GpsTrack track, GpsLocation trackPoint)
    {
        if (track.size() > 0) {
            GpsLocation end = track.getEnd();
            return end.getDistance() + end.getMetersTo(trackPoint);
        }
        else {
            return 0d;
        }
    }

    /**
     * Calculates the number of seconds from the start of the route to the given point.
     * @param track
     * @param trackPoint
     */
    private long calculateRouteTime(GpsTrack track, GpsLocation trackPoint) {
        if (track.size() > 0) {
            long start = track.getStartTime().getTime();
            long pointTime = trackPoint.getTimestamp().getTime();
            long seconds = Math.round((pointTime - start) / 1000);
            return seconds;
        }
        else {
            return 0l;
        }
    }

    /**
     * Calculates the average grade between the last point in the track
     * and the given point.
     * @param track
     * @param trackPoint
     * @return
     */
    private float calculateGrade(GpsTrack track, GpsLocation trackPoint)
    {
        if (track.isEmpty()) {
            return 0f;
        }
        else {
            GpsLocation a = track.get(track.size() - 1);
            double rise = a.getElevation() - trackPoint.getElevation();
            double run = a.getMetersTo(trackPoint);
            float grade = new Float((rise / run) * 100d);
            return grade;
        }
    }

    public void characters(char[] buff, int start, int len)
            throws SAXException
    {
        chars.append(buff, start, len);
    }
}
