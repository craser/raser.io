// ABOUTME: Tests TrailHeadMap, the Google map of trailheads with a card per clicked marker.
// ABOUTME: Google Maps and the DmgMap wrapper are mocked; the trail locations are the real JSON data.

import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrailHeadMap from '@/components/maps/TrailHeadMap';
import TRAIL_DATA from '@/components/maps/TrailMapLocations.json';

const mockGoogleApi = { map: { name: 'DUMMY_MAP' }, maps: { name: 'DUMMY_MAPS' } };

jest.mock('google-map-react', () => {
    const { useEffect } = require('react');
    return function MockGoogleMapReact({ onGoogleApiLoaded }) {
        useEffect(() => onGoogleApiLoaded(mockGoogleApi), []);
        return <div data-testid="mock-google-map"/>;
    };
});

const mockDmgMaps = [];

jest.mock('/blog/maps/map', () => {
    return function MockDmgMap(map, maps) {
        this.map = map;
        this.maps = maps;
        this.zoomToBounds = jest.fn();
        this.marks = [];
        this.markLocation = jest.fn((location) => {
            const mark = {
                location,
                addListener: jest.fn(function (event, handler) {
                    mark.listeners[event] = handler;
                }),
                listeners: {},
                click() {
                    this.listeners.click.call(this);
                },
            };
            this.marks.push(mark);
            return mark;
        });
        mockDmgMaps.push(this);
    };
});

jest.mock('@/components/maps/TrailHeadCard', () => {
    return function MockTrailHeadCard({ trail, hideTrailCard }) {
        return <div data-testid={`trail-card-${trail.fileName}`} onClick={hideTrailCard}/>;
    };
});

describe('TrailHeadMap', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockDmgMaps.length = 0;
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    function renderLoadedMap() {
        const rendered = render(<TrailHeadMap/>);
        act(() => jest.advanceTimersByTime(1000));
        return rendered;
    }

    it('does not mark anything before the trail data has loaded', () => {
        render(<TrailHeadMap/>);
        expect(mockDmgMaps).toHaveLength(1);
        expect(mockDmgMaps[0].markLocation).not.toHaveBeenCalled();
    });

    it('zooms to the trail bounds and marks every trailhead once data and map have loaded', () => {
        renderLoadedMap();
        const dmgMap = mockDmgMaps[0];
        expect(dmgMap.map).toBe(mockGoogleApi.map);
        expect(dmgMap.zoomToBounds).toHaveBeenCalledWith(TRAIL_DATA.bounds);
        expect(dmgMap.markLocation).toHaveBeenCalledTimes(TRAIL_DATA.locations.length);
        expect(dmgMap.marks.map(m => m.location)).toEqual(TRAIL_DATA.locations);
    });

    it('shows a card for each clicked marker', () => {
        const { getByTestId } = renderLoadedMap();
        const [first, second] = mockDmgMaps[0].marks;

        act(() => first.click());
        act(() => second.click());

        expect(getByTestId(`trail-card-${first.location.fileName}`)).toBeInTheDocument();
        expect(getByTestId(`trail-card-${second.location.fileName}`)).toBeInTheDocument();
    });

    it('hides a card when it is clicked', () => {
        const { getByTestId, queryByTestId } = renderLoadedMap();
        const [first, second] = mockDmgMaps[0].marks;
        act(() => first.click());
        act(() => second.click());

        act(() => getByTestId(`trail-card-${first.location.fileName}`).click());

        expect(queryByTestId(`trail-card-${first.location.fileName}`)).toBeNull();
        expect(getByTestId(`trail-card-${second.location.fileName}`)).toBeInTheDocument();
    });
});
