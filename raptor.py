import requests
import json


class RemoteException(Exception):
    pass


class InvalidResponse(Exception):
    pass


class InvalidJson(InvalidResponse):
    pass


class InvalidResponseObject(InvalidResponse):
    pass


class ConnectionError(Exception):
    pass


class InvalidHTTPStatus(Exception):
    pass
        

class RemoteFunction():
    def __init__(self, endpoint: str, remote_function_name: str, token: str) -> None:
        self.remote_function_name = remote_function_name
        self.endpoint = endpoint
        self.token = token

        # создаём объект, из которого будет делаться отправляемый json
        self.object = {}
        self.object["token"] = self.token
        self.object["function"] = {}
        self.object["function"]["name"] = self.remote_function_name

    def __call__(self, *args, **kwargs):
        self.object["function"]["args"] = args
        self.object["function"]["kwargs"] = kwargs
        post_json = json.dumps(self.object)

        try:
            response = requests.post(self.endpoint, data=post_json, headers={"Content-Type": "application/json"})
        except:
            raise ConnectionError
            return

        if response.status_code != 200:
            raise InvalidHTTPStatus

        try:
            response_object = json.loads(response.text)
        except:
            raise InvalidJson
            return

        try:
            remote_exception = response_object["exception"]
            return_object = response_object["return"]
        except:
            raise InvalidResponseObject
            return
        
        if remote_exception != "":
            raise RemoteException(remote_exception)
            return

        if return_object == "NoneType":
            return

        return return_object


class RemoteServer():
    def __init__(self, endpoint: str, token: str = "public") -> None:
        self.endpoint = endpoint
        self.token = token
        self.functions = {}

    def __getattr__(self, __name: str):
        try:
            remote_function = self.functions[__name]
        except KeyError:
            remote_function = RemoteFunction(self.endpoint, __name, self.token)
            self.functions[__name] = remote_function
        
        return remote_function

    def rebind(self, new_endpoint: str, new_token: str):
        self.endpoint = new_endpoint
        self.token = new_token

        for item in self.functions.items():
            item.endpoint = new_endpoint
            item.token = new_token

            

if __name__ == "__main__":
    server = RemoteServer("http://127.0.0.1:5000/", "token")
    azaza = server.func(33, "ffew", lol="33")
    azaza = server.func(355, "ffew", lol="33")
    azaza = server.func(34, "ffff", lol="334")
    print(type(azaza))
    print(azaza)
    print(server.tee(455))

        
