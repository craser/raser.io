import { Park } from '../../../lib/parks/ParkStatus'
import getParkStatus from '../../../lib/parks/ParkStatus'

test('Should retrieve CHSP park status', async () => {
    return Park.CHSP.getStatus()
        .then(status => expect(status).toBe(Park.CLOSED));
})

test('Should retrieve Santiago park status', async () => {
    return Park.SANTIAGO.getStatus()
        .then(status => expect(status).toBe(Park.CLOSED));
})


