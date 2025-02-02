package net.kukido.maps.google;

import net.kukido.maps.GpsLocation;
import org.xml.sax.*;
import org.xml.sax.helpers.DefaultHandler;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Stack;

/**
 * @author craser
 */
public class ElevationResponseParser extends DefaultHandler
{
	private Stack<String> state;
	private StringBuffer chars;
	private GpsLocation loc;
	private ElevationResponse res;

	public ElevationResponse parse(byte[] bytes)
		throws SAXException, IOException
	{
		InputStream in = null;
		try {
			in = new ByteArrayInputStream(bytes);
			return parse(in);
		}
		finally {
			try { in.close(); }
			catch (Exception ignored) {}
		}
	}

	public ElevationResponse parse(InputStream in)
		throws SAXException, IOException
	{
		XMLReader reader = new org.apache.xerces.parsers.SAXParser();
		reader.setContentHandler(this);
		reader.parse(new InputSource(in));

		return res;
	}

	public void startPrefixMapping(String prefix, String uri)
	{
		//noop
	}

	public void error(SAXParseException e)
	{
		e.printStackTrace(System.err);
	}

	public void fatalError(SAXParseException e)
	{
		e.printStackTrace(System.err);
	}

	public void warning(SAXParseException e)
	{		
		e.printStackTrace(System.err);
	}

	public void startDocument()
		throws SAXException
	{
		state = new Stack<String>();
		chars = new StringBuffer();
		res = new ElevationResponse();
	}

	public void startElement(String namespaceUri, String locale, String name, Attributes atts)
		throws SAXException
	{
		state.push(name);
		if ("result".equals(name)) {
			loc = new GpsLocation();
		}
	}

	public void endElement(String namespaceUri, String locale, String name)
		throws SAXException
	{
		String currentState = state.pop();
		if (!currentState.equals(name)) {
			throw new IllegalStateException("ERG! Expected end of \"" + currentState + "\","
											+ " found \"" + name + "\"");
		}

		String val = chars.toString().trim();
		chars = new StringBuffer();

		if ("lat".equals(name)) {
			float lat = Float.parseFloat(val);
			loc.setLatitude(lat);
		}
		else if ("lng".equals(name)) {
			float lon = Float.parseFloat(val);
			loc.setLongitude(lon);
		}
		else if ("elevation".equals(name)) {
			float ele = Float.parseFloat(val);
			loc.setElevation(ele);
		}
		else if ("result".equals(name)) {
			res.add(loc);
			loc = null; // Fail fast.
		}
		else if ("status".equals(name)) {
			res.setStatus(val);
		}
	}

	public void characters(char[] buff, int start, int len)
		throws SAXException
	{
		chars.append(buff, start, len);
	}
}
		
			
		
		
