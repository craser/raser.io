package net.kukido.maps;

import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.text.MessageFormat;
import java.text.SimpleDateFormat;
import java.util.List;

/**
 * Very quick-and-dirty formatter to turn a GpsTrack into GPX-formatted XML.
 * FIXME: Come back and do this with properly, like a grown-up.
 */
public class GpxFormatter
{
    static private final SimpleDateFormat gpxDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:sszz");
    
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
        String open_tag = "<gpx"
                + " version=\"1.0\""
                + " creator=\"GPSBabel - http://www.gpsbabel.org\""
                + " xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\""
                + " xmlns=\"http://www.topografix.com/GPX/1/0\""
                + " xsi:schemaLocation=\"http://www.topografix.com/GPX/1/0 http://www.topografix.com/GPX/1/0/gpx.xsd\">";
        String close_tag = "</gpx>";
        
        out.println(open_tag);
        for (GpsTrack track : tracks) {
            printTrack(track, out);
        }
        out.println(close_tag);
    }
    
    private void printTrack(GpsTrack track, PrintWriter out)
    {
        out.println("<trk>");
        out.println("<name>" + track.getName() + "</name>");
        out.println("<!-- NOT including 'number' element. -->");
        // FIXME: Making the whole thing into one trackseg, regardless 
        // of original segmentatation.
        out.println("<trkseg>");
        String locFormat = "<trkpt lat=\"{0}\" lon=\"{1}\">"
                + "\n<ele>{2}</ele>"
                + "\n<time>{3}</time>" // 2012-08-12T17:35:12Z
                + "\n</trkpt>";
        for (GpsLocation loc : track) {
            String timestamp = gpxDateFormat.format(loc.getTimestamp()).replace(" ", "T");
            String lat = Float.toString(loc.getLatitude());
            String lon = Float.toString(loc.getLongitude());
            String elv = Float.toString(loc.getElevation());
            String logString = MessageFormat.format(locFormat, lat, lon, elv, timestamp);
            out.println(logString);
        }
        out.println("</trkseg>");
        out.println("</trk>");
    }

}
