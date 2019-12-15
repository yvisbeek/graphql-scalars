import { GraphQLObjectType, GraphQLNonNull, GraphQLInputObjectType } from 'graphql/type/definition';
import { GraphQLSchema, graphql } from 'graphql';
import BigIntFactory, { coerceBigInt } from '../src/resolvers/BigInt';

const BigIntResolver = BigIntFactory();

describe('BigInt', () => {

    const Query = new GraphQLObjectType({
        name: 'Query',
        fields: {
            inc: {
                type: new GraphQLNonNull(BigIntResolver),
                args: {
                    num: { type: new GraphQLNonNull(BigIntResolver) }
                },
                resolve: (root, args) => args.num + coerceBigInt('1n')
            },
            emptyErr: {
                type: new GraphQLNonNull(BigIntResolver),
                resolve: () => ''
            },
            typeErr: {
                type: new GraphQLNonNull(BigIntResolver),
                resolve: () => 3.14
            }
        }
    });

    const Mutation = new GraphQLObjectType({
        name: 'Mutation',
        fields: {
            inc: {
                type: new GraphQLNonNull(new GraphQLObjectType({
                    name: 'IncPayload',
                    fields: {
                        result: { type: new GraphQLNonNull(BigIntResolver) }
                    }
                })),
                args: {
                    input: {
                        type: new GraphQLNonNull(new GraphQLInputObjectType({
                            name: 'IncInput',
                            fields: {
                                num: { type: new GraphQLNonNull(BigIntResolver) }
                            }
                        }))
                    }
                },
                resolve: (root, args) => ({ result: args.input.num + coerceBigInt('1n') })
            }
        }
    });

    const schema = new GraphQLSchema({
        query: Query,
        mutation: Mutation
    });

    const validQuery = `{
        a: inc(num: 1)
        b: inc(num: 2147483646)
        c: inc(num: 2147483647)
        d: inc(num: 2147483648)
        e: inc(num: 439857257821345)
        f: inc(num: ${(coerceBigInt(Number.MAX_SAFE_INTEGER) as bigint) + (coerceBigInt('1n') as bigint)})
      }`;

    const invalidQuery2 = `{
        k: typeErr
      }`;

    const validMutation = `mutation test(
        $input1: IncInput!,
        $input2: IncInput!,
        $input4: IncInput!
      ) {
        a: inc(input: $input1) { result }
        b: inc(input: $input2) { result }
        d: inc(input: $input4) { result }
      }`;

    const validVariables = {
        input1: { num: 2147483646 },
        input2: { num: Number.MAX_SAFE_INTEGER - 1 },
        input4: { num: '1' }
    };

    it('2', async () => {
        const { data, errors } = await graphql(schema, invalidQuery2);

        expect(errors).toHaveLength(1);
        expect(errors[0].message).toContain('is not an integer');
        expect(data).toEqual(null);

    });
    it('3', async () => {
        const { data, errors } = await graphql(schema, validQuery);
        expect(errors).toEqual(undefined);
        expect(data).toEqual({
            a: coerceBigInt('2n'),
            b: coerceBigInt('2147483647n'),
            c: coerceBigInt('2147483648n'),
            d: coerceBigInt('2147483649n'),
            e: coerceBigInt('439857257821346n'),
            f: coerceBigInt('9007199254740993n')
        });
    });
    it('4', async () => {
        const { data, errors } = await graphql(schema, validMutation, null, null, validVariables);
        expect(errors).toEqual(undefined);
        expect(data).toEqual({
            a: { result: coerceBigInt('2147483647n') },
            b: { result: coerceBigInt('9007199254740991n') },
            d: { result: coerceBigInt('2n') }
        });
    });
});
