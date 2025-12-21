create table portfolio (
    id serial primary key,
    user_id integer references users(id),
    stock_symbol varchar(10) not null,
    quantity integer not null,
    average_price numeric(10, 2) not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);