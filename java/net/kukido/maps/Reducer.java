package net.kukido.maps;

import java.util.Collections;
import java.util.LinkedList;
import java.util.List;

/**
 * Implementation of Ramer-Douglas-Peucker algorithm.
 * @author craser
 *
 */
public class Reducer
{
    /**
     * 
     * @param maxPoints
     * @param ignored
     * @return
     */
    public GpsTrack reduce(GpsTrack track, int maxPoints, double minDistance) // This seems to confuse the Struts tags.  Changing away from getXxx(int) un-confuses Struts.
    {   
        List<Segment> segments = new LinkedList<Segment>();
        segments.add(new Segment(track, 0, track.size() - 1)); // All Segments share the same GpsTrack.
        
        while (segments.size() < (maxPoints - 1)) { // Leave room for last point, which is the end of the last segment.
        	Segment s = Collections.max(segments); // Find the most interesting segement.
        	int i = segments.indexOf(s); // Split the segment in two and replace it.
        	segments.remove(s);        	
            if (s.getInterest() >= minDistance) {
                segments.addAll(i, s.split());
            }
            else {
                break;
            }
        }
        
        return toTrack(segments);
    }
    
    private GpsTrack toTrack(List<Segment> segments) {
        GpsTrack track = new GpsTrack();
        for (Segment s : segments) {
            track.add(s.getStart());
        }
        track.add(segments.get(segments.size() - 1).getEnd());
        
        return track;        
    }

}
