
const asynchandler=(requestHandler)=>{
    return (req,res,next)=>{  //youll have to reeturn this function too just like below and the promise takes care of running the actual routehandling function(requesthandler) and resolves it while handling errors using catch 
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}





/*simpler one 

const asynchandler= (requestHandler)=> async (req,res,next)=>{
   try {
       await requestHandler(req,res,next)
   } catch (error) {
      res.status(error.code || 500).json({
        success: false,
        message: error.message
      })
   }
}*/