const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const transporter = require('../emailService');
// REGISTER
router.post('/register', async (req, res) => {


const {
    name,
    email,
    phone,
    password,
    role,
    blood_group,
    location,
    latitude,
    longitude
} = req.body;

const hashedPassword = await bcrypt.hash(password, 10);

const sql = `
INSERT INTO users
(name,email,phone,password,role,blood_group,location,latitude,longitude)
VALUES (?,?,?,?,?,?,?,?,?)
`;
db.query(
    sql,
    [
        name,
        email,
        phone,
        hashedPassword,
        role,
        blood_group,
        location,
        latitude,
        longitude
    ],
    (err, result) => {

        if (err) {
            return res.status(500).send(err);
        }

        res.send("Registration Successful");

    }
);


});



// LOGIN
router.post('/login', async (req, res) => {

    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email=?";

    db.query(sql, [email], async (err, result) => {

        if (err) {
            return res.status(500).send(err);
        }

        if (result.length === 0) {
            return res.send("User Not Found");
        }

        const match = await bcrypt.compare(
            password,
            result[0].password
        );

        if (!match) {
            return res.send("Wrong Password");
        }

        const token = jwt.sign(
            {
                id: result[0].id,
                email: result[0].email,
                role: result[0].role
            },
            "bloodlinksecret",
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login Successful",
            token: token
        });

    });
});
// SEARCH DONORS
router.get('/donors/:bloodGroup', (req, res) => {

    const bloodGroup = req.params.bloodGroup;

    const sql = `
    SELECT id,name,email,phone,blood_group,location
    FROM users
    WHERE role='DONOR' AND blood_group=?
    `;

    db.query(sql, [bloodGroup], (err, result) => {

        if (err) {
            return res.status(500).send(err);
        }

        res.json(result);
    });
});

// BLOOD REQUEST
router.post('/request-blood', (req, res) => {

    const {
        patient_name,
        blood_group,
        units_needed,
        hospital,
        location,
        contact
    } = req.body;

    const sql = `
    INSERT INTO blood_requests
    (patient_name,blood_group,units_needed,hospital,location,contact)
    VALUES (?,?,?,?,?,?)
    `;

    db.query(
        sql,
        [
            patient_name,
            blood_group,
            units_needed,
            hospital,
            location,
            contact
        ],
        (err, result) => {

            if (err) {
                return res.status(500).send(err);
            }

            const donorSql =
            "SELECT email,name FROM users WHERE role='DONOR' AND blood_group=?";

            db.query(
                donorSql,
                [blood_group],
                (err, donors) => {

                    if (!err && donors.length > 0) {

                        donors.forEach((donor) => {

                            transporter.sendMail({
                                from: 'venkateshjalapur@gmail.com',
                                to: donor.email,
                                subject: 'URGENT BLOOD REQUEST',
                                text:
                                `Dear ${donor.name},

A blood request has been submitted.

Patient: ${patient_name}
Blood Group: ${blood_group}
Units Needed: ${units_needed}
Hospital: ${hospital}
Location: ${location}
Contact: ${contact}

Please donate if available.

BloodLink Team`
                            });

                        });

                    }

                    res.send("Blood Request Submitted & Donors Notified");

                }
            );

        }
    );
});
// VIEW ALL BLOOD REQUESTS
router.get('/all-requests', (req, res) => {

    const sql = "SELECT * FROM blood_requests";

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).send(err);
        }

        res.json(result);
    });
});
router.post('/hospital-register', (req, res) => {

    const {
        hospital_name,
        email,
        password,
        location
    } = req.body;

    const sql = `
    INSERT INTO hospitals
    (hospital_name,email,password,location)
    VALUES (?,?,?,?)
    `;

    db.query(
        sql,
        [hospital_name,email,password,location],
        (err,result) => {

            if(err){
                return res.status(500).send(err);
            }

            res.send("Hospital Registered");
        }
    );
});
// HOSPITAL REGISTER
router.post('/hospital-register', (req, res) => {

    const {
        hospital_name,
        email,
        password,
        location
    } = req.body;

    const sql = `
    INSERT INTO hospitals
    (hospital_name,email,password,location)
    VALUES (?,?,?,?)
    `;

    db.query(
        sql,
        [hospital_name, email, password, location],
        (err, result) => {

            if (err) {
                return res.status(500).send(err);
            }

            res.send("Hospital Registered");
        }
    );
});
// HOSPITAL LOGIN
router.post('/hospital-login', (req, res) => {

    const { email, password } = req.body;

    const sql = "SELECT * FROM hospitals WHERE email=?";

    db.query(sql, [email], (err, result) => {

        if (err) {
            return res.status(500).send(err);
        }

        if (result.length === 0) {
            return res.send("Hospital Not Found");
        }

        if (result[0].password !== password) {
            return res.send("Wrong Password");
        }

        const token = jwt.sign(
    {
        id: result[0].id,
        email: result[0].email
    },
    "bloodlinksecret",
    { expiresIn: "1d" }
);

res.json({
    message: "Login Successful",
    token: token
});
    });
});
// ADMIN DASHBOARD
router.get('/admin-dashboard', (req, res) => {

    const sql = `
    SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM hospitals) AS total_hospitals,
        (SELECT COUNT(*) FROM blood_requests) AS total_requests,
        (SELECT COUNT(*) FROM blood_requests WHERE status='APPROVED') AS approved_requests
    `;

    db.query(sql, (err, result) => {

        if(err){
            return res.status(500).send(err);
        }

        res.json(result[0]);

    });
});
router.post('/emergency-alert', (req, res) => {

    const { blood_group } = req.body;

    const sql =
    "SELECT name,email FROM users WHERE role='DONOR' AND blood_group=?";

    db.query(sql, [blood_group], (err, donors) => {

        if (err) {
            return res.status(500).send(err);
        }

        donors.forEach((donor) => {

            transporter.sendMail({
                from: 'ajayk800373@gmail.com',
                to: donor.email,
                subject: '🚨 EMERGENCY BLOOD ALERT',
                text:
                `Dear ${donor.name},

URGENT BLOOD REQUIREMENT

Blood Group Needed: ${blood_group}

Please contact the nearest hospital immediately if you can donate.

BloodLink Emergency System`
            });

        });

        res.send("Emergency Alert Sent Successfully");

    });

});
router.post('/emergency-alert', (req, res) => {

    const { blood_group } = req.body;

    const sql =
    "SELECT name,email FROM users WHERE role='DONOR' AND blood_group=?";

    db.query(sql, [blood_group], (err, donors) => {

        if(err){
            return res.status(500).send(err);
        }

        donors.forEach((donor) => {

            transporter.sendMail({
                from: 'venkateshjalapur@gmail.com',
                to: donor.email,
                subject: '🚨 Emergency Blood Alert',
                text:
                `Emergency Blood Requirement

Blood Group Needed: ${blood_group}

Please contact the hospital immediately if you can donate.

BloodLink Team`
            });

        });

        res.send("Emergency Alert Sent Successfully");

    });
});
router.post('/emergency-alert', (req, res) => {

    const { blood_group } = req.body;

    const sql =
    "SELECT name,email FROM users WHERE role='DONOR' AND blood_group=?";

    db.query(sql, [blood_group], (err, donors) => {

        if(err){
            return res.status(500).send(err);
        }

        if(donors.length === 0){
            return res.send("No Donors Found");
        }

        donors.forEach((donor) => {

            transporter.sendMail({
                from: 'venkateshjalapur@gmail.com',
                to: donor.email,
                subject: '🚨 Emergency Blood Alert',
                text:
`URGENT BLOOD REQUIREMENT

Blood Group Needed: ${blood_group}

Please contact the hospital immediately if you are available to donate.

BloodLink Team`
            });

        });

        res.send("Emergency Alert Sent Successfully");

    });

});
router.get('/donor-locations', (req, res) => {

    const sql = `
    SELECT
    name,
    blood_group,
    latitude,
    longitude
    FROM users
    WHERE role='DONOR'
    `;

    db.query(sql, (err, result) => {

        if(err){
            return res.status(500).send(err);
        }

        res.json(result);

    });

});
router.get('/donor-locations', (req, res) => {

```
const sql = 
SELECT name,blood_group,latitude,longitude
FROM users
WHERE role='DONOR'
;

db.query(sql, (err, result) => {

    if(err){
        return res.status(500).send(err);
    }

    res.json(result);

});
```

});
router.get('/analytics', (req, res) => {

    const sql = `
    SELECT blood_group, COUNT(*) AS total
    FROM users
    WHERE role='DONOR'
    GROUP BY blood_group
    `;

    db.query(sql, (err, result) => {

        if(err){
            return res.status(500).send(err);
        }

        res.json(result);

    });

});

module.exports = router;