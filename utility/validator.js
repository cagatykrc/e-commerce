const {check,query, validationResult, body} = require('express-validator');
const express = require('express');

exports.validateSignIn = [
    body('email')
        .trim()
        .normalizeEmail()
        .not()
        .isEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email address!')
        .bail(),
    body('password')
        .trim()
        .escape()
        .not()
        .isEmpty()
        .withMessage('Password can not be empty!')
        .bail()
        .isLength({min: 6})
        .withMessage('Minimum 6 characters required!')
        .bail(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({errors: errors.array()});
        next();
    },
];

exports.validateSignUp = [
    body('firstName')
        .trim()
        .escape()
        .not()
        .isEmpty()
        .withMessage('First name can not be empty!')
        .bail()
        .isLength({min: 3})
        .withMessage('Minimum 3 characters required!')
        .bail(),
    body('lastName')
        .trim()
        .escape()
        .not()
        .isEmpty()
        .withMessage('Last name can not be empty!')
        .bail()
        .isLength({min: 3})
        .withMessage('Minimum 3 characters required!')
        .bail(),
    // check('username')
    //     .trim()
    //     .escape()
    //     .not()
    //     .isEmpty()
    //     .withMessage('Username can not be empty!')
    //     .bail()
    //     .isLength({min: 3})
    //     .withMessage('Minimum 3 characters required!')
    //     .bail(),
    body('email')
        .trim()
        .normalizeEmail()
        .not()
        .isEmpty()
        .isEmail()
        .withMessage('Invalid email address!')
        .bail(),
    body('password')
        .trim()
        .escape()
        .not()
        .isEmpty()
        .withMessage('Password can not be empty!')
        .bail()
        .isLength({min: 6})
        .withMessage('Minimum 6 characters required!')
        .bail()
        .matches(/\d/)
        .withMessage('Password must contain a number!')
        .bail()
        .matches(/[a-z]/)
        .withMessage('Password must contain a lowercase letter!')
        .bail(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({errors: errors.array()});
        next();
    }
];

