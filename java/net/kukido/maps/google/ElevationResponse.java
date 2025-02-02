package net.kukido.maps.google;

import net.kukido.maps.GpsLocation;
import net.kukido.maps.GpsTrack;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a response from Google's elevation API.
 * @see https://developers.google.com/maps/documentation/elevation
 */
public class ElevationResponse
{
	private String status;
	private List<GpsLocation> locs;

	public ElevationResponse()
	{
		this("OK", new ArrayList<GpsLocation>());
	}

	public ElevationResponse(String status, List<GpsLocation> locs)
	{
		this.status = status;
		this.locs = locs;
	}

	public void setStatus(String status)
	{
		this.status = status;
	}

	public String getStatus()
	{
		return this.status;
	}

	public void add(GpsLocation loc)
	{
		locs.add(loc);
	}

	public List<GpsLocation> getLocations()
	{
		// Copy the list, so that calling classes can't mess with our data.
		return new ArrayList<GpsLocation>(this.locs);
	}

	/**
	 * Assigns new elevations to the locations in the given GpsTrack
	 * based on the information provided by Google.
	 */
	public void fixElevations(GpsTrack track, int start)
	{
		for (int i = 0; i < locs.size(); i++) {
			GpsLocation t = track.get(start + i);
			GpsLocation r = locs.get(i);
			if (haveSameLocation(t, r)) {
				t.setElevation(r.getElevation());
			}
			else {
				System.out.println("i: " + i);
				System.out.println("start: " + start);
				System.out.println("Location at position " + i + " doesn't match track position " + (i + start));
				for (int j = 0; j < track.size(); j++) {
					GpsLocation l = track.get(j);
					if (haveSameLocation(l, r)) {
						System.out.println("Found match at index " + j);
					}
				}
			}
		}
	}

	/**
	 * Might need to tweak this to deal with float-related
	 * irregularities, vagaries of Google's response, etc.
	 */
	private boolean haveSameLocation(GpsLocation a, GpsLocation b) 
	{
		return a.getLatitude() == b.getLatitude()
			&& a.getLongitude() == b.getLongitude();
	}
}
		