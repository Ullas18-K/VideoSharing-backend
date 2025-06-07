class ApiResponse{
    constructor(
        statuscode,
        data,
        message="Success",
        erros=[]
    ){
        this.statuscode=statuscode
        this.data=data
        this.success=statuscode<400
        this.message=message || (this.statuscode<400 ? "Success" : "Failure")
        this.erros=erros
        //   if(this.statuscode<400){
        //     this.message=message
        // }else{
        //     this.message="Failure"
        // }
    }
}
export default ApiResponse