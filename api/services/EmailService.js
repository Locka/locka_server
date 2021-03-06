module.exports = {

    forgetPassword: function(user, newPassword){
        var result = true;
        sails.hooks.email.send(
            "../../views/email/forgetPassword",
            {
                newPassword: newPassword,
                recipientName: user.fullName(),
                senderName: "Locka Team",
            }
            ,
            {
                to: user.email,
                subject: "new password"
            },
            function(err){
                if(err){
                    result = err;
                }
            }
        )
        return result;
    },
};