create table Coaches
(
    coach_id                   varchar(255)     not null
        primary key,
    slug                       varchar(255)     null,
    username                   varchar(255)     not null,
    profile_picture_url        varchar(255)     null,
    profile_picture_url_expiry int              null,
    public_profile_picture     bit default b'0' not null,
    show_email_publicly        bit default b'0' not null,
    show_phone_number_publicly bit default b'0' not null
);

