 const logger = require('../utils/Logger')
const { validateRegistration } = require('../utils/validation')
//user registration

const registerUser = async (req,res) => {
    logger.info('Registration endpoint hit....')



    try {
        const {} = validateRegistration(req.body)

        if (error) {
            logger.warn('Validation error', error.details[0].message  )
            
        }

    } catch (error) {
        
    }
    
}


//user login

//refresh token

//logout