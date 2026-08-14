import asyncio


class VehicleSimulator:

    async def simulate_vehicle_movement(

        self,

        websocket,

        route_coordinates
    ):

        for point in route_coordinates:

            await websocket.send_json({

                "type": "vehicle_position",

                "data": point
            })

            await asyncio.sleep(1)